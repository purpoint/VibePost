import PostHeader from './PostHeader.jsx';
import PostContent from './PostContent.jsx';
import PostImage from './PostImage.jsx';
import PostActions from './PostActions.jsx';
import styles from './PostCard.module.css';

/**
 * A single post.
 *
 * Presentational: everything it needs arrives as props and every action is a
 * callback, so the feed keeps ownership of the data.
 */
export default function PostCard({ post, currentUserId, onLike, onComment, onDelete, deleting }) {
  return (
    <article className={styles.card}>
      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        canDelete={Boolean(currentUserId) && post.author.userId === currentUserId}
        onDelete={() => onDelete(post)}
        deleting={deleting}
      />

      <PostContent text={post.text} />
      <PostImage src={post.imageUrl} authorName={post.author.name} />

      <PostActions
        likeCount={post.likeCount ?? post.likes?.length ?? 0}
        commentCount={post.commentCount ?? post.comments?.length ?? 0}
        likedByMe={Boolean(post.likedByMe)}
        onLike={() => onLike(post)}
        onComment={() => onComment(post)}
      />
    </article>
  );
}
