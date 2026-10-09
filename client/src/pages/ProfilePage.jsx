import { useState } from 'react';
import { Save, User, Lock, Globe, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, CardHeader, Field, PageHeader } from '../components/common/index.jsx';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'AED', 'SGD'];
const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    currency: user?.currency || 'INR',
    timezone: user?.timezone || 'Asia/Kolkata',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profile);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await updateProfile(passwords);
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account details and preferences." />

      <div className="grid grid-2">
        <Card>
          <CardHeader title="Account details" icon={User} />
          <div className="card__body">
            <div className="flex" style={{ marginBottom: 20 }}>
              <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.1rem' }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{user?.name}</div>
                <div className="hint">{user?.email}</div>
              </div>
            </div>
            <form onSubmit={saveProfile} className="col" style={{ display: 'flex', gap: 14 }}>
              <Field label="Full name">
                <input
                  className="input"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </Field>
              <Field label="Email" hint="Email cannot be changed">
                <input className="input" value={user?.email || ''} disabled />
              </Field>
              <div className="form-grid">
                <Field label="Default currency">
                  <div className="input-group">
                    <Coins size={16} className="input-group__icon" />
                    <select
                      className="select"
                      style={{ paddingLeft: 34 }}
                      value={profile.currency}
                      onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label="Timezone">
                  <div className="input-group">
                    <Globe size={16} className="input-group__icon" />
                    <select
                      className="select"
                      style={{ paddingLeft: 34 }}
                      value={profile.timezone}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    >
                      {TIMEZONES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>
              <div className="flex" style={{ justifyContent: 'flex-end' }}>
                <Button type="submit" icon={Save} disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <Card>
          <CardHeader title="Change password" icon={Lock} />
          <div className="card__body">
            <form onSubmit={savePassword} className="col" style={{ display: 'flex', gap: 14 }}>
              <Field label="Current password">
                <input
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                />
              </Field>
              <Field label="New password" hint="At least 8 characters">
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
              </Field>
              <div className="flex" style={{ justifyContent: 'flex-end' }}>
                <Button type="submit" icon={Save} disabled={savingPassword}>
                  {savingPassword ? 'Updating…' : 'Update password'}
                </Button>
              </div>
            </form>
            <div className="auth-demo" style={{ marginTop: 18 }}>
              Passwords are hashed with bcrypt. Your financial records are always scoped to your
              account.
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
