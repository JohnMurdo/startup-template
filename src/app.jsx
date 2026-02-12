import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export default function App() {
  return (
  <BrowserRouter>
  <div className="app bg-dark text-light">App will display here</div>;
    <header>
        {/* <img src="CovenantCraftLogo.jpg" alt="CovenantCraftLogo"> */}
        <h1>
            Login
        </h1>
        <nav>
            <h2>Username</h2>
            <ul>
                <li>
                    <a href="index.html">Login</a>
                </li>
                <li>
                    <a href="read.html">Read</a>
                </li>
                <li>
                    <a href="note.html">Note</a>
                </li>
                <li>
                    <a href="friends.html">Friends</a>
                </li>
            </ul>
        </nav>
    </header>
  </BrowserRouter>
  );
}
function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}