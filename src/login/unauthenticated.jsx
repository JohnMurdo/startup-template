import React from 'react';

import Button from 'react-bootstrap/Button';
import { MessageDialog } from './messageDialog';

export function Unauthenticated(props) {
  const [userName, setUserName] = React.useState(props.userName || '');
  const [password, setPassword] = React.useState('');
  const [displayError, setDisplayError] = React.useState(null);

  async function loginUser() {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: userName, password }),
      });
      if (!response.ok) {
        let errorMsg = 'Login failed';
        try {
          const error = await response.json();
          errorMsg = error.msg || errorMsg;
        } catch {
          errorMsg = `Server error: ${response.status}`;
        }
        setDisplayError(errorMsg);
        return;
      }
      localStorage.setItem('userName', userName);
      props.onLogin(userName);
    } catch (err) {
      setDisplayError(err.message || 'Login failed - is the server running?');
    }
  }

  async function createUser() {
    try {
      const response = await fetch('/api/auth/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: userName, password }),
      });
      if (!response.ok) {
        let errorMsg = 'Create user failed';
        try {
          const error = await response.json();
          errorMsg = error.msg || errorMsg;
        } catch {
          errorMsg = `Server error: ${response.status}`;
        }
        setDisplayError(errorMsg);
        return;
      }
      localStorage.setItem('userName', userName);
      props.onLogin(userName);
    } catch (err) {
      setDisplayError(err.message || 'Create failed - is the server running?');
    }
  }

  return (
    <>
      <div>
        <div className='input-group mb-3'>
          <span className='input-group-text'>@</span>
          <input className='form-control' type='text' value={userName} onChange={(e) => setUserName(e.target.value)} placeholder='your@email.com' />
        </div>
        <div className='input-group mb-3'>
          <span className='input-group-text'>🔒</span>
          <input className='form-control' type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='password' />
        </div>
        <Button variant='primary' onClick={loginUser} disabled={!userName || !password}>
          Login
        </Button>
        <Button variant='secondary' onClick={createUser} disabled={!userName || !password}>
          Create
        </Button>
      </div>

      <MessageDialog message={displayError} onHide={() => setDisplayError(null)} />
    </>
  );
}
