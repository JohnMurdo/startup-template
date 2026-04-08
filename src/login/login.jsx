import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Unauthenticated } from './unauthenticated';
import { Authenticated } from './authenticated';
import { AuthState } from './authState';


export function Login(props) {
  const { userName, authState, onAuthChange } = props;
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
        {/* <form action="read.html" method="get">
            <label>Username:</label>
            <input type="text" name="username"/>

            <label>Password:</label>
            <input type="password" name="password"/>

            <button className="secondary" type="submit">Login</button>
        </form> */}
        <div>
        {/* {authState !== AuthState.Unknown && <h1>Welcome to Simon</h1>} */}
        {authState === AuthState.Authenticated && (
          <Authenticated userName={userName} onLogout={() => onAuthChange(userName, AuthState.Unauthenticated)} />
        )}
        {authState === AuthState.Unauthenticated && (
          <Unauthenticated
            userName={userName}
            onLogin={(loginUserName) => {
              onAuthChange(loginUserName, AuthState.Authenticated);
            }}
          />
        )}
      </div>
        <footer>
            <a href="https://github.com/JohnMurdo/startup-template.git" target="_blank">GitHub</a>
        </footer>
      </div>
    </main>
  );
}