import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthState } from '../login/authState.js';

function getQueryValue(searchParams, key) {
  const value = searchParams.get(key);
  return value ? value : null;
}

export function Note(props) {
  const { userName, authState } = props;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const chapterBook = getQueryValue(searchParams, 'book');
  const chapterNumber = getQueryValue(searchParams, 'chapter');

  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(chapterBook || '');
  const [selectedChapter, setSelectedChapter] = useState(chapterNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (authState === AuthState.Authenticated) {
      setSelectedBook(chapterBook || '');
      setSelectedChapter(chapterNumber || '');
      loadNotes();
    }
  }, [authState, chapterBook, chapterNumber]);

  async function loadNotes() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notes', {
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Unable to load notes');
      }
      const noteList = await response.json();
      setNotes(noteList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function selectNote(note) {
    setSelectedNoteId(note._id);
    setContent(note.content);
    setSelectedBook(note.book || '');
    setSelectedChapter(note.chapter ? String(note.chapter) : '');
  }

  function clearEditor() {
    setSelectedNoteId(null);
    setContent('');
    setSelectedBook(chapterBook || '');
    setSelectedChapter(chapterNumber || '');
    setSuccess(null);
  }

  async function saveNote() {
    if (!content.trim()) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const notePayload = {
        content,
        book: selectedBook || null,
        chapter: selectedChapter || null,
      };
      const url = selectedNoteId ? `/api/notes/${selectedNoteId}` : '/api/notes';
      const method = selectedNoteId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notePayload),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Unable to save note');
      }

      if (selectedNoteId) {
        setNotes((current) => current.map((note) => note._id === selectedNoteId ? { ...note, content, book: selectedBook || null, chapter: selectedChapter ? parseInt(selectedChapter, 10) : null } : note));
        setSuccess('Note updated successfully!');
      } else {
        const createdNote = await response.json();
        setNotes((current) => [createdNote, ...current]);
        setSuccess('Note saved successfully!');
      }
      clearEditor();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteNote(noteId) {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Unable to delete note');
      }
      setNotes((current) => current.filter((note) => note._id !== noteId));
      if (selectedNoteId === noteId) {
        clearEditor();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (authState !== AuthState.Authenticated) {
    return (
      <main className="container-fluid page-container text-center">
        <div>
          <header>
            <h1>Notes</h1>
            <nav>
              <ul className="nav nav-pills justify-content-center">
                <li className="nav-item"><NavLink className="nav-link" to="../">Login</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="../read">Read</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="../note">Note</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="../friends">Friends</NavLink></li>
              </ul>
            </nav>
          </header>
          <section className="mt-4">
            <p>Please log in to access your user-specific notes.</p>
            <NavLink to="../">
              <button className="btn btn-primary">Go to Login</button>
            </NavLink>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="container-fluid page-container">
      <div className="note-page">
        <header className="text-center mb-4">
          <h1>My Notes</h1>
          <p className="text-muted">Signed in as {userName}</p>
          <nav>
            <ul className="nav nav-pills justify-content-center">
              <li className="nav-item"><NavLink className="nav-link" to="../">Login</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="../read">Read</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link active" to="../note">Note</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="../friends">Friends</NavLink></li>
            </ul>
          </nav>
        </header>

        <section className="note-editor mb-4">
          <div className="mb-3">
            <label className="form-label">Chapter (optional)</label>
            <div className="row g-2">
              <div className="col-sm-8">
                <input
                  className="form-control"
                  type="text"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  placeholder="Book name"
                />
              </div>
              <div className="col-sm-4">
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  placeholder="Chapter"
                />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <textarea
              className="form-control"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
            />
          </div>
          <div className="d-flex gap-2 justify-content-center mb-3">
            <button className="btn btn-primary" onClick={saveNote} disabled={!content.trim()}>
              {selectedNoteId ? 'Update Note' : 'Save Note'}
            </button>
            <button className="btn btn-outline-secondary" onClick={clearEditor}>
              Clear
            </button>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
        </section>

        <section className="note-list">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-0">All your notes</h2>
              <small className="text-muted">Sorted by most recent first.</small>
            </div>
            <button className="btn btn-sm btn-outline-primary" onClick={loadNotes} disabled={loading}>
              Refresh
            </button>
          </div>
          {loading && <div className="text-center">Loading notes…</div>}
          {!loading && notes.length === 0 && <div className="text-muted">No notes yet. Create one above.</div>}
          <div className="list-group">
            {notes.map((note) => (
              <div key={note._id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <small className="text-muted">
                      {note.book && note.chapter ? `${note.book} ${note.chapter}` : 'General'} • {new Date(note.date).toLocaleString()}
                    </small>
                  </div>
                  <div className="btn-group btn-group-sm" role="group">
                    <button className="btn btn-outline-secondary" onClick={() => selectNote(note)}>
                      Edit
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => deleteNote(note._id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mb-0">{note.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}