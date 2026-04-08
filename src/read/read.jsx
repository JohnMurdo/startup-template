import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
function parseReference(reference) {
  const trimmed = reference.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;

  const chapterPart = parts[parts.length - 1];
  const chapterNumber = parseInt(chapterPart, 10);
  if (Number.isNaN(chapterNumber)) return null;

  const book = parts.slice(0, parts.length - 1).join(' ');
  return { book, chapter: chapterNumber };
}

function parseChapterId(chapterId) {
  const match = chapterId.match(/^([0-9]*[a-z]+)(\d+)$/i);
  if (!match) return null;
  return { book: match[1], chapter: parseInt(match[2], 10) };
}

export function Read() {
  const [book, setBook] = React.useState('Genesis');
  const [chapter, setChapter] = React.useState(1);
  const [searchValue, setSearchValue] = React.useState('Genesis 1');
  const [chapterData, setChapterData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function loadChapter(bookName, chapterNumber) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/bible/${encodeURIComponent(bookName)}/${encodeURIComponent(chapterNumber)}`);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || 'Unable to fetch chapter');
      }
      const data = await response.json();
      setChapterData(data);
      setBook(bookName);
      setChapter(chapterNumber);
      setSearchValue(`${bookName} ${chapterNumber}`);
    } catch (err) {
      setError(err.message || 'Failed to load chapter');
      setChapterData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChapter(book, chapter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const parsed = parseReference(searchValue);
    if (!parsed) {
      setError('Please enter a book and chapter, for example "John 3".');
      return;
    }

    loadChapter(parsed.book, parsed.chapter);
  }

  function handleNavigateChapter(direction) {
    if (!chapterData) return;

    const chapterId = direction === 'previous' ? chapterData.prevChapterId : chapterData.nextChapterId;
    if (!chapterId) return;

    const parsed = parseChapterId(chapterId);
    if (!parsed) {
      setError('Unable to navigate to the next chapter.');
      return;
    }

    loadChapter(parsed.book, parsed.chapter);
  }

  const verseList = chapterData?.chapter?.verses || [];
  const title = chapterData?.chapter?.bookTitle || book;
  const currentChapterNumber = chapterData?.chapter?.number || chapter;

  return (
    <main className="container-fluid page-container text-light py-4">
      <div className="mx-auto" style={{ maxWidth: 900 }}>
        <header className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h1>Read</h1>
              <p className="mb-0">Read scripture chapters and navigate by chapter or search.</p>
            </div>
            <nav>
              <ul className="nav">
                <li className="nav-item"><NavLink className="nav-link" to="../">Login</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="../read">Read</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="../note">Note</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="../friends">Friends</NavLink></li>
              </ul>
            </nav>
          </div>

          {chapterData && (
            <div className="mb-3 text-end">
              <NavLink
                className="btn btn-outline-primary"
                to={`/note?book=${encodeURIComponent(title)}&chapter=${currentChapterNumber}`}
              >
                Open notes for this chapter
              </NavLink>
            </div>
          )}

          <form className="mb-3" onSubmit={handleSearchSubmit}>
            <div className="input-group">
              <input
                className="form-control"
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search scripture, e.g. Genesis 1"
              />
              <button className="btn btn-primary" type="submit" disabled={loading}>Go</button>
            </div>
          </form>

          <div className="d-flex align-items-center justify-content-between">
            <button
              className="btn btn-outline-light"
              type="button"
              onClick={() => handleNavigateChapter('previous')}
              disabled={!chapterData?.prevChapterId || loading}
            >
              ← Previous
            </button>
            <div>
              <strong>{title} {currentChapterNumber}</strong>
            </div>
            <button
              className="btn btn-outline-light"
              type="button"
              onClick={() => handleNavigateChapter('next')}
              disabled={!chapterData?.nextChapterId || loading}
            >
              Next →
            </button>
          </div>
        </header>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="alert alert-secondary" role="status">
            Loading chapter...
          </div>
        )}

        {!loading && !error && (
          <section className="bg-light text-dark rounded p-4">
            {verseList.length > 0 ? (
              verseList.map((verse, index) => (
                <p key={index} className="mb-2">
                  <strong>{index + 1}.</strong> {verse.text}
                </p>
              ))
            ) : (
              <p>No verses found for this chapter.</p>
            )}
          </section>
        )}

        <footer className="mt-4 text-center">
          <a href="https://github.com/JohnMurdo/startup-template.git" target="_blank" rel="noreferrer" className="btn btn-link text-light">GitHub</a>
        </footer>
      </div>
    </main>
  );
}