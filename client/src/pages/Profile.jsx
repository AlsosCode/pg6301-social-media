import React, { useEffect, useState } from 'react';

function Profile() {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    fetchSession();
  }, []);

  async function fetchSession() {
    try {
      setError(null);
      const res = await fetch('http://localhost:3001/api/session', {
        credentials: 'include'
      });
      const data = await res.json();
      setSessionInfo(data);

      if (data.loggedIn) {
        fetchAllPosts();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchAllPosts() {
    try {
      const res = await fetch('http://localhost:3001/api/posts', {
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

  function startEditing(post) {
    setEditingPostId(post.id);
    setEditedTitle(post.title);
    setEditedText(post.text);
  }

  function cancelEditing() {
    setEditingPostId(null);
    setEditedTitle('');
    setEditedText('');
  }

  async function saveEdit(postId) {
    try {
      setError(null);
      const res = await fetch(`http://localhost:3001/api/posts/${postId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          text: editedText
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to edit post');
      }
      await fetchAllPosts();
      cancelEditing();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePost(postId) {
    try {
      setError(null);
      const res = await fetch(`http://localhost:3001/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }
      fetchAllPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }
  if (!sessionInfo) {
    return <p>Loading session info...</p>;
  }
  if (!sessionInfo.loggedIn) {
    return <p>You are not logged in. Please log in first.</p>;
  }

  const myPosts = posts.filter((p) => p.authorId === sessionInfo.user.id);

  return (
    <div>
      <h1>Profile</h1>
      <p>Welcome, {sessionInfo.user.name}!</p>

      <h2>My Posts</h2>
      {myPosts.length === 0 ? (
        <p>You haven't posted anything yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {myPosts.map((post) => (
            <li
              key={post.id}
              style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '1rem' }}
            >
              {editingPostId === post.id ? (
                <div>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    style={{ display: 'block', marginBottom: '0.5rem' }}
                  />
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    style={{ display: 'block', marginBottom: '0.5rem' }}
                  />
                  <button className="button" onClick={() => saveEdit(post.id)}>Save</button>
                  <button className="button" onClick={cancelEditing}>Cancel</button>
                </div>
              ) : (
                <>
                  <h3>{post.title}</h3>
                  <p>{post.text}</p>
                  <button className="button1" onClick={() => startEditing(post)}>Edit</button>
                  <button className="button3" onClick={() => deletePost(post.id)}>Delete</button>

                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Profile;
