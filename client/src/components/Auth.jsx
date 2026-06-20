import { useState } from 'react';
import useAuthStore from '../stores/useAuthStore';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login, register } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="loading-screen" style={{ backgroundImage: 'radial-gradient(circle at center, var(--bg-secondary), var(--bg-primary))' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '32px', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--accent-primary)', marginBottom: '8px', letterSpacing: '1px' }}>
          Welcome to NexusChat
        </h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '24px' }}>
          {isLogin ? 'Welcome back! We missed you.' : 'Create an account to get started.'}
        </p>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>USERNAME</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" style={{ marginTop: '8px', padding: '12px', backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}>
            {isLogin ? 'Log In' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.85rem', textAlign: 'center' }}>
          <span className="text-muted">{isLogin ? 'Need an account? ' : 'Already have an account? '}</span>
          <span 
            style={{ color: 'var(--accent-secondary)', cursor: 'pointer', fontWeight: '500' }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Register' : 'Log In'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
