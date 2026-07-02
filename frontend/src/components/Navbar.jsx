import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar${user?.role === 'admin' ? ' navbar-admin' : ''}`}>
      <Link to="/" className="brand">
        <span className="brand-mark">T</span>
        <span className="brand-word">Tavola</span>
        {user?.role === 'admin' && <span className="brand-tag">Ledger</span>}
      </Link>
      <div className="nav-links">
        {user?.role === 'customer' && <Link to="/dashboard">My Reservations</Link>}
        {user?.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
        {user ? (
          <>
            <span className="nav-user">
              {user.name} <span className="role-badge">{user.role}</span>
            </span>
            <button onClick={handleLogout} className="btn btn-outline">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}