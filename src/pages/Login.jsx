import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple login logic - store dummy data and redirect
    localStorage.setItem('token', 'dummy-token');
    localStorage.setItem('role', 'admin');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{color: 'hsl(45, 100%, 20%)'}}>
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              placeholder="Username"
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{border: '1px solid hsl(45, 100%, 85%)', focusRingColor: 'hsl(45, 43%, 58%)'}}
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{border: '1px solid hsl(45, 100%, 85%)', focusRingColor: 'hsl(45, 43%, 58%)'}}
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 text-white rounded-md transition-colors"
            style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;