import { Link } from 'react-router-dom';
import { Wallet, Home } from 'lucide-react';
import { Button } from '../components/common/index.jsx';

export default function NotFoundPage() {
  return (
    <div className="auth-page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="auth-main">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="empty__icon" style={{ margin: '0 auto 18px' }}>
            <Wallet size={28} />
          </div>
          <h2 style={{ fontSize: '2.4rem' }}>404</h2>
          <p className="auth-card__sub">We couldn’t find the page you were looking for.</p>
          <Link to="/">
            <Button icon={Home}>Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
