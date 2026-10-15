
'use client';

import { useEffect, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type User = {
  id: number;
  name: string;
  email: string;
};

export default function AuthScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const token = sessionStorage.getItem('careertrack_token');

      if (token) {
        try {
          const response = await fetch(`${API}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (active) setUser(data.user);
          } else if (response.status === 401) {
            sessionStorage.removeItem('careertrack_token');
            sessionStorage.removeItem('careertrack_user');
          } else if (active) {
            setError('Unable to verify your session.');
          }
        } catch {
          if (active) {
            setError('Cannot connect to the backend server.');
          }
        }
      }

      if (active) setReady(true);
    }

    function handleLogout() {
      if (active) {
        setUser(null);
        setPassword('');
      }
    }

    checkSession();

    window.addEventListener('careertrack-logout', handleLogout);

    return () => {
      active = false;
      window.removeEventListener('careertrack-logout', handleLogout);
    };
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API}/api/auth/${register ? 'register' : 'login'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            register
              ? { name, email, password }
              : { email, password }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      if (register) {
        setRegister(false);
        setPassword('');
        setMessage('Account created successfully! Please log in.');
      } else {
        sessionStorage.setItem('careertrack_token', data.token);
        sessionStorage.setItem(
          'careertrack_user',
          JSON.stringify(data.user)
        );

        setUser(data.user);
        setPassword('');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('careertrack_token');
    sessionStorage.removeItem('careertrack_user');

    setUser(null);
    setPassword('');
    setError('');
    setMessage('');
  }

  if (!ready) {
    return (
      <div className="auth-loading">
        Loading CareerTrack...
      </div>
    );
  }

  if (user) {
    return (
      <>
        <div className="auth-userbar">
          <span>
            Welcome, <strong>{user.name}</strong>
          </span>

          <button type="button" onClick={logout}>
            Log Out ↗
          </button>
        </div>

        {children}
      </>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">
          ✦ Career<span>Track</span>
        </div>

        <div className="auth-kicker">
          YOUR CAREER STARTS HERE
        </div>

        <h1>
          {register ? 'Create your account' : 'Welcome back'}
        </h1>

        <p>
          {register
            ? 'Create an account to track your applications.'
            : 'Log in to manage your career opportunities.'}
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success" role="status">
            {message}
          </div>
        )}

        <form onSubmit={submit}>
          {register && (
            <label>
              Full Name
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </label>
          )}

          <label>
            Email Address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={register ? 8 : undefined}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : register
                ? 'Create Account'
                : 'Log In'}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {register
              ? 'Already have an account?'
              : "Don't have an account?"}
          </span>

          <button
            type="button"
            onClick={() => {
              setRegister(!register);
              setError('');
              setMessage('');
              setPassword('');
            }}
          >
            {register ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </section>
    </main>
  );
}
