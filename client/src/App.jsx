import { useEffect } from 'react';
import useAuthStore from './stores/useAuthStore';
import Auth from './components/Auth';
import ChatLayout from './components/ChatLayout';

function App() {
  const { isAuthenticated, user, fetchMe, token } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  if (!isAuthenticated) {
    return <Auth />;
  }

  if (isAuthenticated && !user) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return <ChatLayout />;
}

export default App;
