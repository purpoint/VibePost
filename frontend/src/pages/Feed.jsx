import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, SearchX, WifiOff } from 'lucide-react';
import Navbar from '../components/Navbar/Navbar.jsx';
import SearchBar from '../components/SearchBar/SearchBar.jsx';
import FeedFilters from '../components/FeedFilters/FeedFilters.jsx';
import CreatePost from '../components/CreatePost/CreatePost.jsx';
import PostCard from '../components/PostCard/PostCard.jsx';
import PostSkeleton from '../components/PostSkeleton/PostSkeleton.jsx';
import EmptyState from '../components/EmptyState/EmptyState.jsx';
import Button from '../components/Button/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { postsApi } from '../services/api.js';
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
  const [sort, setSort] = useState('latest');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Posts with a like request in flight. A second click on the same post is
  // ignored until the first settles, so a rapid double-click cannot race two
  // toggles against each other.
  const likesInFlight = useRef(new Set());

  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const loadFeed = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const { posts: loaded } = await postsApi.list({ sort, search: activeSearch });
      setPosts(loaded);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  }, [sort, activeSearch]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

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

    const previous = { likedByMe: post.likedByMe, likeCount: post.likeCount };
    patchPost(post._id, {
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
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
      <div className={styles.list}>
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={user?.id}
            deleting={deletingId === post._id}
            onDelete={handleDelete}
            onLike={() => requireAuth(() => handleLike(post))}
            onComment={() => requireAuth(() => {})}
          />
        ))}
      </div>
    );
  }

  function clearSearch() {
    setSearchInput('');
    setActiveSearch('');
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={() => setActiveSearch(searchInput.trim())}
          onClear={clearSearch}
        />

        <CreatePost onCreated={handleCreated} />

        <FeedFilters value={sort} onChange={setSort} />

        {activeSearch && status === 'ready' && posts.length > 0 && (
          <p className={styles.resultSummary} role="status">
            Showing results for “{activeSearch}”
          </p>
        )}

        {renderFeed()}
      </main>
    </div>
  );
}
