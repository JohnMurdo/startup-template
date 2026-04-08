import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes} from 'react-router-dom';
import { Login } from './login/login.jsx';
import { Read } from './read/read.jsx';
import { Note } from './note/note.jsx';
import { AuthState } from './login/authState.js';
import { Friends } from './friends/friends.jsx';

export default function App() {
  const [userName, setUserName] = React.useState(localStorage.getItem('userName') || '');
  const currentAuthState = userName ? AuthState.Authenticated : AuthState.Unauthenticated;
  const [authState, setAuthState] = React.useState(currentAuthState);
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return (
  <BrowserRouter>
    <div className="app d-flex justify-content-end p-3">
      <button type="button" className="btn btn-secondary" onClick={toggleTheme}>
        Toggle Dark Mode
      </button>
    </div>
    <Routes>
      <Route
            path='/'
            element={
              <Login
                userName={userName}
                authState={authState}
                onAuthChange={(userName, authState) => {
                  setAuthState(authState);
                  setUserName(userName);
                }}
              />
            }
            exact
          />
      <Route path='/read' element={<Read onToggleTheme={toggleTheme} />} />
      <Route path='/note' element={<Note />} />
      <Route path='/friends' element={<Friends />} />
      <Route path='*' element={<NotFound />} />
    </Routes>
  </BrowserRouter>
  );
}
function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}