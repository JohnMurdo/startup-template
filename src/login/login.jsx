import React from 'react';

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
        <main>
            <form action="read.html" method="get">
                <label>Username:</label>
                <input type="text" name="username">

                <label>Password:</label>
                <input type="password" name="password">

                <button class="secondary" type="submit">Login</button>
            </form>
        </main>
        <footer>
            <button id="toggle">Toggle Dark Mode</button>
            <script>
                const html = document.documentElement;
                document.getElementById("toggle").onclick = () => {
                    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
                };
            </script>
            <a href="https://github.com/JohnMurdo/startup-template.git" target="_blank">GitHub</a>
        </footer>
      </div>
    </main>
  );
}