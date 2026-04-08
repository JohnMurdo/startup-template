import React, { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthState } from '../login/authState.js';

export function Friends(props) {
  const { userName, authState } = props;
  const [notes, setNotes] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (authState === AuthState.Authenticated) {
      loadPublicNotes();
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [authState]);

  async function loadPublicNotes() {
    try {
      setLoading(true);
      const response = await fetch('/api/public-notes');
      if (!response.ok) {
        throw new Error('Failed to load public notes');
      }
      const publicNotes = await response.json();
      setNotes(publicNotes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  function handleWebSocketMessage(data) {
    if (data.type === 'post_liked') {
      setNotes(currentNotes =>
        currentNotes.map(note =>
          note._id === data.postId
            ? {
                ...note,
                likes: [...(note.likes || []), data.userEmail]
              }
            : note
        )
      );
    } else if (data.type === 'post_unliked') {
      setNotes(currentNotes =>
        currentNotes.map(note =>
          note._id === data.postId
            ? {
                ...note,
                likes: (note.likes || []).filter(email => email !== data.userEmail)
              }
            : note
        )
      );
    } else if (data.type === 'comment_liked') {
      setComments(currentComments => {
        const updatedComments = { ...currentComments };
        Object.keys(updatedComments).forEach(postId => {
          updatedComments[postId] = updatedComments[postId]?.map(comment =>
            comment._id === data.commentId
              ? {
                  ...comment,
                  likes: [...(comment.likes || []), data.userEmail]
                }
              : comment
          ) || [];
        });
        return updatedComments;
      });
    } else if (data.type === 'comment_unliked') {
      setComments(currentComments => {
        const updatedComments = { ...currentComments };
        Object.keys(updatedComments).forEach(postId => {
          updatedComments[postId] = updatedComments[postId]?.map(comment =>
            comment._id === data.commentId
              ? {
                  ...comment,
                  likes: (comment.likes || []).filter(email => email !== data.userEmail)
                }
              : comment
          ) || [];
        });
        return updatedComments;
      });
    } else if (data.type === 'comments_updated') {
      setComments(currentComments => ({
        ...currentComments,
        [data.postId]: data.comments
      }));
    }
  }

  async function loadComments(postId) {
    if (comments[postId]) {
      // Comments already loaded
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }
      const postComments = await response.json();
      setComments(current => ({
        ...current,
        [postId]: postComments
      }));
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }

  async function toggleLike(postId, isLiked) {
    try {
      const token = getAuthToken();
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      // Update local state immediately for better UX
      setNotes(currentNotes =>
        currentNotes.map(note =>
          note._id === postId
            ? {
                ...note,
                likes: isLiked
                  ? (note.likes || []).filter(email => email !== userName)
                  : [...(note.likes || []), userName]
              }
            : note
        )
      );

      // Send WebSocket message
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: isLiked ? 'unlike_post' : 'like_post',
          postId,
          token,
        }));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }

  async function toggleCommentLike(commentId, postId, isLiked) {
    try {
      const token = getAuthToken();
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle comment like');
      }

      // Update local state
      setComments(currentComments => ({
        ...currentComments,
        [postId]: currentComments[postId]?.map(comment =>
          comment._id === commentId
            ? {
                ...comment,
                likes: isLiked
                  ? (comment.likes || []).filter(email => email !== userName)
                  : [...(comment.likes || []), userName]
              }
            : comment
        ) || []
      }));

      // Send WebSocket message
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: isLiked ? 'unlike_comment' : 'like_comment',
          commentId,
          token,
        }));
      }
    } catch (err) {
      console.error('Error toggling comment like:', err);
    }
  }

  async function addComment(postId) {
    if (!newComment.trim()) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      setNewComment('');
      setActiveCommentPost(null);

      // Send WebSocket message
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'new_comment',
          postId,
          content: newComment,
          token,
        }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  }

  function getAuthToken() {
    return document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  }

  function isLiked(item) {
    return (item.likes || []).includes(userName);
  }

  if (authState !== AuthState.Authenticated) {
    return (
      <main className="container-fluid page-container text-center">
        <div>
          <h1>Please sign in to view friends' notes</h1>
          <NavLink className="btn btn-primary" to="../">Sign In</NavLink>
        </div>
      </main>
    );
  }

  return (
    <main className="container-fluid page-container">
      <div className="mx-auto" style={{ maxWidth: 800 }}>
        <header className="text-center mb-4">
          <h1>Friends</h1>
          <p className="text-muted">Signed in as {userName}</p>
          <nav>
            <ul className="nav nav-pills justify-content-center">
              <li className="nav-item"><NavLink className="nav-link" to="../">Login</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="../read">Read</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="../note">Note</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link active" to="../friends">Friends</NavLink></li>
            </ul>
          </nav>
        </header>

        <section className="friends-feed">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">Public Notes Feed</h2>
            <button className="btn btn-sm btn-outline-primary" onClick={loadPublicNotes} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading && <div className="text-center">Loading public notes…</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && notes.length === 0 && (
            <div className="text-center text-muted">
              No public notes yet. Create some notes and make them public to share with friends!
            </div>
          )}

          <div className="feed-list">
            {notes.map((note) => (
              <div key={note._id} className="card mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="card-title mb-1">{note.userEmail}</h5>
                      <small className="text-muted">
                        {note.book && note.chapter ? `${note.book} ${note.chapter}` : 'General note'} • {new Date(note.date).toLocaleString()}
                      </small>
                    </div>
                  </div>

                  <p className="card-text">{note.content}</p>

                  <div className="d-flex gap-2 align-items-center">
                    <button
                      className={`btn btn-sm ${isLiked(note) ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => toggleLike(note._id, isLiked(note))}
                    >
                      👍 {note.likes?.length || 0}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        loadComments(note._id);
                        setActiveCommentPost(activeCommentPost === note._id ? null : note._id);
                      }}
                    >
                      💬 Comments ({comments[note._id]?.length || 0})
                    </button>
                  </div>

                  {activeCommentPost === note._id && (
                    <div className="mt-3">
                      <div className="mb-3">
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                        />
                        <button
                          className="btn btn-sm btn-primary mt-2"
                          onClick={() => addComment(note._id)}
                          disabled={!newComment.trim()}
                        >
                          Post Comment
                        </button>
                      </div>

                      <div className="comments-list">
                        {(comments[note._id] || []).map((comment) => (
                          <div key={comment._id} className="border-start border-secondary ps-3 mb-2">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong>{comment.userEmail}</strong>
                                <small className="text-muted ms-2">
                                  {new Date(comment.date).toLocaleString()}
                                </small>
                              </div>
                              <button
                                className={`btn btn-sm ${isLiked(comment) ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                                onClick={() => toggleCommentLike(comment._id, note._id, isLiked(comment))}
                              >
                                👍 {comment.likes?.length || 0}
                              </button>
                            </div>
                            <p className="mb-0 mt-1">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}