import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, SearchX, WifiOff } from 'lucide-react';
import Navbar from '../components/Navbar/Navbar.jsx';
import SearchBar from '../components/SearchBar/SearchBar.jsx';
import FeedFilters from '../components/FeedFilters/FeedFilters.jsx';
import CreatePost from '../components/CreatePost/CreatePost.jsx';
import CommentModal from '../components/CommentModal/CommentModal.jsx';
import PostCard from '../components/PostCard/PostCard.jsx';
import PostSkeleton from '../components/PostSkeleton/PostSkeleton.jsx';
import EmptyState from '../components/EmptyState/EmptyState.jsx';
import Button from '../components/Button/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { postsApi } from '../services/api.js';
import { useDebounce } from '../hooks/useDebounce.js';
import styles from './Feed.module.css';

/**
 * The public feed.
 *
 * Readable without an account; posting, liking and commenting send a
 * logged-out visitor to the login screen. Feed state lives here and PostCard
 * receives data and callbacks, keeping the card presentational.
 */
export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState('');
  const [sort, setSort] = useState('latest');
  const [searchInput, setSearchInput] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);

  // Posts with a like request in flight. A second click on the same post is
  // ignored until the first settles, so a rapid double-click cannot race two
  // toggles against each other.
  const likesInFlight = useRef(new Set());

  // Searching happens as the reader types, once they pause. Submitting the
  // form still works and simply runs the search that is already pending.
  const activeSearch = useDebounce(searchInput.trim(), 400);

  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  /**
   * Loads the first page. Runs whenever the sort or the search term changes,
   * which also resets pagination — page 2 of one query has nothing to do with
   * page 2 of another.
   */
  const loadFeed = useCallback(async () => {
    setStatus('loading');
    setError('');
    setLoadMoreError('');
    try {
      const { posts: loaded, pagination: page } = await postsApi.list({
        page: 1,
        sort,
        search: activeSearch,
      });
      setPosts(loaded);
      setPagination(page);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  }, [sort, activeSearch]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  /**
   * Appends the next page.
   *
   * Existing posts are kept on failure so a flaky request never costs the
   * reader what they were already looking at; the error appears beside the
   * button instead. Posts already on screen are filtered out of the incoming
   * page, because a post created while paging would otherwise shift the
   * offset and arrive twice.
   */
  async function handleLoadMore() {
    if (loadingMore || !pagination?.hasNextPage) return;

    setLoadingMore(true);
    setLoadMoreError('');
    try {
      const { posts: nextPage, pagination: page } = await postsApi.list({
        page: pagination.page + 1,
        sort,
        search: activeSearch,
      });

      setPosts((current) => {
        const seen = new Set(current.map((post) => post._id));
        return [...current, ...nextPage.filter((post) => !seen.has(post._id))];
      });
      setPagination(page);
    } catch (requestError) {
      setLoadMoreError(requestError.message);
    } finally {
      setLoadingMore(false);
    }
  }

  /** Sends a logged-out visitor to the login screen instead of the action. */
  const requireAuth = useCallback(
    (action) => {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: '/feed' } });
        return;
      }
      action();
    },
    [isAuthenticated, navigate]
  );

  /** Applies a partial update to one post in the list. */
  const patchPost = useCallback((postId, changes) => {
    setPosts((current) =>
      current.map((post) => (post._id === postId ? { ...post, ...changes } : post))
    );
  }, []);

  /**
   * Likes or unlikes a post.
   *
   * The card updates before the request completes so the button feels
   * instant; if the server disagrees the change is rolled back, and the
   * authoritative count from the response is applied either way.
   */
  async function handleLike(post) {
    if (likesInFlight.current.has(post._id)) return;
    likesInFlight.current.add(post._id);

    // Read the count exactly as PostCard renders it: a post that ever arrives
    // without the derived virtual would otherwise make the count NaN.
    const currentCount = post.likeCount ?? post.likes?.length ?? 0;
    const previous = { likedByMe: post.likedByMe, likeCount: currentCount };

    patchPost(post._id, {
      likedByMe: !post.likedByMe,
      likeCount: currentCount + (post.likedByMe ? -1 : 1),
    });

    try {
      const { liked, likeCount, likes } = await postsApi.toggleLike(post._id);
      patchPost(post._id, { likedByMe: liked, likeCount, likes });
    } catch (likeError) {
      patchPost(post._id, previous);
      showError(likeError.message);
    } finally {
      likesInFlight.current.delete(post._id);
    }
  }

  /** Keeps a card's comment count in step with the modal. */
  const handleCommentCount = useCallback(
    (postId, commentCount) => patchPost(postId, { commentCount }),
    [patchPost]
  );

  /** A new post appears at the top of the feed immediately, with no refetch. */
  function handleCreated(post) {
    setPosts((current) => [post, ...current]);
    showSuccess('Your post is live.');
  }

  async function handleDelete(post) {
    setDeletingId(post._id);
    try {
      await postsApi.remove(post._id);
      setPosts((current) => current.filter((item) => item._id !== post._id));
      // Don't leave the comment modal open on a post that no longer exists.
      setCommentsFor((open) => (open?._id === post._id ? null : open));
      showSuccess('Post deleted.');
    } catch (deleteError) {
      showError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  }

  function renderFeed() {
    if (status === 'loading') {
      return (
        <div className={styles.list}>
          {Array.from({ length: 3 }, (_, index) => (
            <PostSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (status === 'error') {
      return (
        <EmptyState
          icon={WifiOff}
          title="Couldn't load the feed"
          message={error}
          action={<Button onClick={loadFeed}>Try again</Button>}
        />
      );
    }

    if (posts.length === 0) {
      return activeSearch ? (
        <EmptyState
          icon={SearchX}
          title="No posts found"
          message="Try another search term."
          action={
            <Button variant="ghost" onClick={clearSearch}>
              Clear search
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Inbox}
          title="No posts yet"
          message="Be the first person to share something on VibePost."
        />
      );
    }

    return (
      <>
        <div className={styles.list}>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={user?.id}
              deleting={deletingId === post._id}
              onDelete={handleDelete}
              onLike={() => requireAuth(() => handleLike(post))}
              // Reading comments is public; only writing one needs an account.
              onComment={() => setCommentsFor(post)}
            />
          ))}
        </div>

        {pagination?.hasNextPage && (
          <div className={styles.loadMore}>
            {loadMoreError && (
              <p className={styles.loadMoreError} role="alert">
                {loadMoreError}
              </p>
            )}
            <Button variant="ghost" onClick={handleLoadMore} loading={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more posts'}
            </Button>
          </div>
        )}

        {pagination && !pagination.hasNextPage && posts.length >= pagination.limit && (
          <p className={styles.endOfFeed}>You&apos;re all caught up.</p>
        )}
      </>
    );
  }

  function clearSearch() {
    setSearchInput('');
  }

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#feed-content">
        Skip to posts
      </a>

      <Navbar />

      <main className={styles.main} id="feed-content" aria-busy={status === 'loading'}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={loadFeed}
          onClear={clearSearch}
        />

        <CreatePost onCreated={handleCreated} />

        <FeedFilters value={sort} onChange={setSort} />

        {activeSearch && status === 'ready' && posts.length > 0 && (
          <p className={styles.resultSummary} role="status">
            {pagination?.totalPosts ?? posts.length}{' '}
            {pagination?.totalPosts === 1 ? 'result' : 'results'} for “{activeSearch}”
          </p>
        )}

        {renderFeed()}
      </main>

      {commentsFor && (
        <CommentModal
          post={commentsFor}
          onClose={() => setCommentsFor(null)}
          onCountChange={handleCommentCount}
        />
      )}
    </div>
  );
}
