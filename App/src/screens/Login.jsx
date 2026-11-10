'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [dest, setDest] = useState('/');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect?.startsWith('/') && !redirect.startsWith('//')) setDest(redirect);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const u = await login(email, password);
      router.push(u.role === 'admin' ? '/admin' : dest);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fill = (em, pw) => { setEmail(em); setPassword(pw); };

  return (
    <div className="auth-wrap">
      <form className="card auth-card rise" onSubmit={submit}>
        <h2>Bon retour 👋</h2>
        <p className="sub">Connectez-vous pour commander et suivre vos livraisons.</p>

        <div className="field">
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@exemple.bj" />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>

        {error && <div className="notice notice-err" style={{ marginBottom: '.8rem' }}>{error}</div>}

        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.9rem', color: 'var(--muted)' }}>
          Pas encore de compte ? <Link href="/inscription" style={{ color: 'var(--green)', fontWeight: 700 }}>Créer un compte</Link>
        </p>

        <div className="demo-creds">
          <strong>Comptes de démonstration :</strong><br />
          👤 Client — <code onClick={() => fill('client@hypermarket.bj', 'client123')} style={{ cursor: 'pointer' }}>client@hypermarket.bj / client123</code><br />
          🛠️ Admin — <code onClick={() => fill('admin@hypermarket.bj', 'admin123')} style={{ cursor: 'pointer' }}>admin@hypermarket.bj / admin123</code><br />
          <span style={{ fontSize: '.74rem' }}>(cliquez pour pré-remplir)</span>
        </div>
      </form>
    </div>
  );
}
