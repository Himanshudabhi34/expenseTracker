import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import { Button, Field, PasswordInput } from '../components/common/index.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h2>Create your account</h2>
      <p className="auth-card__sub">Start tracking your daily income and expenses.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Full name">
          <div className="input-group">
            <User size={16} className="input-group__icon" />
            <input
              className="input"
              placeholder="Jane Doe"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        </Field>
        <Field label="Email">
          <div className="input-group">
            <Mail size={16} className="input-group__icon" />
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <PasswordInput
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </Field>
        {error ? <span className="field-error">{error}</span> : null}
        <Button type="submit" icon={UserPlus} block disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
