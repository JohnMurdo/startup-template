import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';

export function Login() {
  return (
    <main className="container-fluid bg-secondary text-center">
      <div>
        <header>
            <img src="CovenantCraftLogo.jpg" alt="CovenantCraftLogo"/>
            <h1>
                Login
            </h1>
            <nav>
                <h2>Username</h2>
                <ul>
                    <li>
                        <NavLink to="../login">Login</NavLink>
                    </li>
                    <li>
                        <NavLink to="../read">Read</NavLink>
                    </li>
                    <li>
                        <NavLink to="../note">Note</NavLink>
                    </li>
                    <li>
                        <NavLink to="../friends">Friends</NavLink>
                    </li>
                </ul>
            </nav>
        </header>
        <form action="read.html" method="get">
            <label>Username:</label>
            <input type="text" name="username"/>

            <label>Password:</label>
            <input type="password" name="password"/>

            <button className="secondary" type="submit">Login</button>
        </form>
        <footer>
            <button id="toggle">Toggle Dark Mode</button>
            <a href="https://github.com/JohnMurdo/startup-template.git" target="_blank">GitHub</a>
        </footer>
      </div>
    </main>
  );
}