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
  
  useEffect(() => {
      const html = document.documentElement;
      const toggle = document.getElementById("toggle");

      if (toggle) {
          toggle.onclick = () => {
              html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
          };
      }
  }, []);

  return (
  <BrowserRouter>
  <div className="app bg-dark text-light"></div>
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
      <Route path='/read' element={<Read />} />
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