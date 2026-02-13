import React from 'react';

export function Friends() {
  return (
    <main className="container-fluid bg-secondary text-center">
      <div>
        <header>
            {/* <?xml version="1.0" encoding="utf-8"?/> */}
            {/* <!-- License: PD. Made by theforgesmith: https://icons.theforgesmith.com --> */}
            <svg id="nav_people" width="800px" height="800px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="3" fill="none">
                <circle cx="22.83" cy="22.57" r="7.51"/>
                <path d="M38,49.94a15.2,15.2,0,0,0-15.21-15.2h0a15.2,15.2,0,0,0-15.2,15.2Z"/>
                <circle cx="44.13" cy="27.22" r="6.05"/>
                <path d="M42.4,49.94h14A12.24,12.24,0,0,0,44.13,37.7h0a12.21,12.21,0,0,0-5.75,1.43"/>
            </svg>
            <h1>
                Friends
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
                        <a href="freinds.html">Friends</a>
                    </li>
                </ul>
            </nav>
        </header>
        <main>
            <h2>Feed</h2>
            <div>
                <h3>Hannah</h3>
                <p>
                    26 ¶ And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth. 
                </p>
                <button>Like</button>
                <button>Comment</button>
                <div>
                    <h3>Comments</h3>
                    <div>
                        <h4>Timmy</h4>
                        <p>Wow, great scripture!</p>
                        <button>Like</button>
                    </div>
                </div>
            </div>
        </main>
        <footer>
            <button id="toggle">Toggle Dark Mode</button>
            {/* <script>
                const html = document.documentElement;
                document.getElementById("toggle").onclick = () => {
                    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
                };
            </script> */}
            <nav>
                <a href="read.html">
                    <button>Search</button>
                </a>
                <button>Trending</button>
            </nav>
            <a href="https://github.com/JohnMurdo/startup-template.git" target="_blank">GitHub</a>
        </footer>
      </div>
    </main>
  );
}