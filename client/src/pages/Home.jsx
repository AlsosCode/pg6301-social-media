import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../apiBase'; // <-- import your helper

function Home() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  async function fetchAllPosts() {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to fetch posts');
      }
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createPost() {
    try {
      setError(null);
      if (!title || !text) {
        throw new Error('Title and text are required');
      }
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create post');
      }
      setTitle('');
      setText('');
      fetchAllPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reactToPost(postId, emoji) {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/react`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: emoji })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to react');
      }
      fetchAllPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addComment(postId, commentText) {
    try {
      setError(null);
      if (!commentText) return;
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add comment');
      }
      fetchAllPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Home</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Title (e.g. My Awesome Post)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />
        <textarea
          placeholder="Write your post text here (10-1000 chars)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />
        <button className="button4" onClick={createPost}>
          {/* ... your SVG, etc. ... */}
          <span>Post</span>
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts.map((post) => (
          <li key={post.id} style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '1rem' }}>
            <h3>{post.title} </h3>
            <p>{post.text}</p>
            <p>Author ID: {post.authorId}</p>

            <div>
              <strong>React:</strong>{' '}
              <button className="button2" onClick={() => reactToPost(post.id, '👍')}>👍</button>{' '}
              <button className="button2" onClick={() => reactToPost(post.id, '❤️')}>❤️</button>{' '}
              <button className="button2" onClick={() => reactToPost(post.id, '😂')}>😂</button>
            </div>

            {post.reactions && post.reactions.length > 0 && (
              <div>
                <strong>Reactions:</strong>
                <ul>
                  {post.reactions.map((r, index) => (
                    <li key={index}>
                      User {r.userId} reacted with {r.reaction}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <CommentForm postId={post.id} onAddComment={addComment} />

            {post.comments && post.comments.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Comments:</strong>
                <ul>
                  {post.comments.map((c) => (
                    <li key={c.id}>
                      User {c.userId}: {c.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentForm({ postId, onAddComment }) {
  const [commentText, setCommentText] = useState('');

  function handleComment() {
    onAddComment(postId, commentText);
    setCommentText('');
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <input
        placeholder="Write a comment..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        style={{ width: '200px' }}
      />
      <button className="button1" onClick={handleComment}>Comment</button>
    </div>
  );
}

export default Home;
