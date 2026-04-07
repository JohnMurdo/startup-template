import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';

export function Read() {

    const genesisChapters = ['Genesis 1','Genesis 2','Genesis 3'];
    const [index, setIndex] = React.useState(0);
    const [text, setText] = React.useState(genesisChapters[index]);
    function updateChapter(newIndex) {
        setIndex(newIndex);
        setText(genesisChapters[index]);
    }

  return (
    <main className="container-fluid bg-secondary text-center">
      <div>
        <header>
            {/* <?xml version="1.0" encoding="utf-8"?> */}
            {/* <!-- License: CC Attribution. Made by tetrisly: https://tetrisly.gumroad.com/l/freeicons --> */}
            <svg id="nav_book" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M9.5,4.49758215 L12,5.53107667 L14.5,4.49758215 C16.1048534,3.83413928 17.8951466,3.83413928 19.5,4.49758215 L21.3713907,5.27121095 C21.7510491,5.4281609 22,5.80818588 22,6.23078653 L22,18.4734945 C22,19.0442778 21.5522847,19.506989 21,19.506989 C20.8727806,19.506989 20.7467296,19.4819008 20.6286093,19.4330701 L19.5,18.9665055 C17.8951466,18.3030626 16.1048534,18.3030626 14.5,18.9665055 L12,20 L9.5,18.9665055 C7.89514664,18.3030626 6.10485336,18.3030626 4.5,18.9665055 L3.37139068,19.4330701 C2.85860716,19.6450537 2.27663672,19.3872837 2.07152331,18.8573248 C2.0242752,18.7352481 2,18.6049751 2,18.4734945 L2,6.23078653 C2,5.80818588 2.24895094,5.4281609 2.62860932,5.27121095 L4.5,4.49758215 C6.10485336,3.83413928 7.89514664,3.83413928 9.5,4.49758215 Z M5.26407973,6.34587384 L4,6.86844163 L4,17.0141076 C6.02542236,16.2540083 8.25752963,16.2887104 10.2640797,17.1182138 L11,17.422 L11,7.282 L8.73592027,6.34587384 C7.62037223,5.88470872 6.37962777,5.88470872 5.26407973,6.34587384 Z M15.2640797,6.34587384 L13,7.281 L13,17.422 L13.7359203,17.1182138 C15.7424704,16.2887104 17.9745777,16.2540083 20,17.0141077 L20,6.86844163 L18.7359203,6.34587384 C17.6203722,5.88470872 16.3796278,5.88470872 15.2640797,6.34587384 Z"/>
            </svg>
            <h1>
                Read
            </h1>
            <nav>
                <h2>Username</h2>
                <ul>
                    <li>
                        <NavLink to="../">Login</NavLink>
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
        <main>
            {/* add java script that grabs gen1, 2 3 from txt file */}
            <p>
                {text}
            </p>
        </main>
        <footer>
            <button id="toggle">Toggle Dark Mode</button>
            <nav>
                <a href="#">
                    <button onClick={() => updateChapter(index > 0 ? index - 1 : 0)}>&lt;</button>
                </a>
                Genesis 1
                <a href="#">
                    <button onClick={() => updateChapter(index < genesisChapters.length - 1 ? index + 1 : index)}>&gt;</button>
                </a>
            </nav>
            <a href="https://github.com/JohnMurdo/startup-template.git" target="_blank">GitHub</a>
        </footer>
      </div>
    </main>
  );
}