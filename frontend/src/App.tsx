import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './auth/KeycloakContext';

function App() {
  const { initialized } = useAuth();

  if (!initialized) {
    return <div>Initializing authentication...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 