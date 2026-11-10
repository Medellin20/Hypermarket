import Providers from './providers.jsx';
import Navbar from '../src/components/Navbar.jsx';
import './globals.css';
import '../src/styles/global.css';

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

export const metadata = {
  title: 'HyperMarket Cotonou — Vos supermarchés livrés à domicile',
  description: 'Comparez les prix et faites-vous livrer vos courses à Cotonou.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
