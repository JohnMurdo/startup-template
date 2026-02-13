import React, { useEffect } from 'react';

export function Login() {

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