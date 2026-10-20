import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card rise" onSubmit={submit}>
        <h2>Créer un compte</h2>
        <p className="sub">Rejoignez HyperMarket Cotonou et profitez de -10% sur votre première commande.</p>

        <div className="field">
          <label>Nom complet</label>
          <input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required placeholder="Aïcha Hounkpatin" />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="vous@exemple.bj" />
        </div>
        <div className="field">
          <label>Téléphone (optionnel)</label>
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+229 ..." />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} placeholder="6 caractères minimum" />
        </div>

        {error && <div className="notice notice-err" style={{ marginBottom: '.8rem' }}>{error}</div>}

        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.9rem', color: 'var(--muted)' }}>
          Déjà inscrit ? <Link to="/connexion" style={{ color: 'var(--green)', fontWeight: 700 }}>Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
