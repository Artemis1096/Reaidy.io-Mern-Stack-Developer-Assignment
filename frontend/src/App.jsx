import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { usePageTracking } from './hooks/trackingHooks';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import { login, register } from './api/client';
import './App.css';

const LoginModal = ({ isOpen, onClose, onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      authLogin(data.user, data.token);
      onClose();
      setEmail('');
      setPassword('');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="modal-switch">
          Don't have an account? <button onClick={onSwitch} className="link-btn">Sign Up</button>
        </p>
      </div>
    </div>
  );
};

const SignupModal = ({ isOpen, onClose, onSwitch }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register(name, email, password);
      authLogin(data.user, data.token);
      onClose();
      setName('');
      setEmail('');
      setPassword('');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="modal-switch">
          Already have an account? <button onClick={onSwitch} className="link-btn">Login</button>
        </p>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  usePageTracking();
  const { getCartItemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const cartCount = getCartItemCount();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <Link to="/">🛍️ ShowUp</Link>
        </div>
        <div className="links">
          <Link to="/">Home</Link>
          <Link to="/cart" className="cart-link">
            Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          {isAuthenticated ? (
            <>
              <span className="user-name">👤 {user?.name}</span>
              <button className="btn-secondary" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setShowLogin(true)}>Login</button>
              <button className="btn-primary" onClick={() => setShowSignup(true)}>Sign Up</button>
            </>
          )}
        </div>
      </nav>
      <main>{children}</main>
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
        onSwitch={() => { setShowLogin(false); setShowSignup(true); }}
      />
      <SignupModal 
        isOpen={showSignup} 
        onClose={() => setShowSignup(false)} 
        onSwitch={() => { setShowSignup(false); setShowLogin(true); }}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
