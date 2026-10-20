import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Catalogue from './pages/Catalogue.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Notifications from './pages/Notifications.jsx';
import Admin from './pages/Admin.jsx';

function Protected({ children, admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Footer() {
  return (
    <footer className="foot">
      <div className="container">
        <div className="brand"><span className="mark">🛒</span> HyperMarket <small>Cotonou</small></div>
        <p>Vos supermarchés de Cotonou réunis sur une seule plateforme. Commandez, payez par Mobile Money et faites-vous livrer à domicile.</p>
        <p style={{ marginTop: '1rem', fontSize: '.8rem' }}>© {new Date().getFullYear()} HyperMarket Cotonou — Projet v1. Paiements MTN MoMo · Moov Money · Celtiis Cash · Espèces · Crypto.</p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Catalogue />} />
          <Route path="/panier" element={<Cart />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/commande" element={<Protected><Checkout /></Protected>} />
          <Route path="/mes-commandes" element={<Protected><Orders /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
