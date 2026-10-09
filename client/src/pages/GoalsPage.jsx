import { useState } from 'react';
import { Plus, Target, Pencil, Trash2, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { useAsync } from '../hooks/useAsync.js';
import { goalApi } from '../api/resources.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  ProgressBar,
  Spinner,
  Badge,
} from '../components/common/index.jsx';
import { formatCurrency, formatDate, toInputDate } from '../utils/format.js';

const emptyForm = { name: '', targetAmount: '', currentAmount: '', targetDate: '' };

function ProgressRing({ value }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, value) / 100) * circumference;
  return (
    <svg className="progress-ring" viewBox="0 0 74 74">
      <circle cx="37" cy="37" r={radius} fill="none" stroke="var(--bg-soft)" strokeWidth="7" />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle
        cx="37"
        cy="37"
        r={radius}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 37 37)"
        style={{ transition: 'stroke-dashoffset 600ms ease' }}
      />
      <text x="37" y="41" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--text)">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

export default function GoalsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.currency || 'INR';

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [contributing, setContributing] = useState(null);
  const [contribution, setContribution] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const { data, loading, reload } = useAsync(() => goalApi.list(), []);
  const goals = data?.goals || [];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(goal) {
    setEditing(goal);
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate ? toInputDate(goal.targetDate) : '',
    });
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.targetAmount || Number(form.targetAmount) <= 0) {
      toast.error('Enter a name and a valid target amount');
      return;
    }
    const payload = {
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      currentAmount: form.currentAmount ? Number(form.currentAmount) : 0,
      targetDate: form.targetDate || null,
    };
    setSaving(true);
    try {
      if (editing) {
        await goalApi.update(editing.id, payload);
        toast.success('Goal updated');
      } else {
        await goalApi.create(payload);
        toast.success('Goal created');
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Could not save goal');
    } finally {
      setSaving(false);
    }
  }

  async function handleContribution() {
    const amount = Number(contribution);
    if (!amount || amount === 0) {
      toast.error('Enter a non-zero amount');
      return;
    }
    try {
      await goalApi.update(contributing.id, { contribution: amount });
      toast.success('Goal updated');
      setContributing(null);
      setContribution('');
      reload();
    } catch (err) {
      toast.error(err.message || 'Could not update goal');
    }
  }

  async function handleDelete() {
    setDeletingBusy(true);
    try {
      await goalApi.remove(deleting.id);
      toast.success('Goal deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    } finally {
      setDeletingBusy(false);
    }
  }

  if (loading && !data) return <Spinner center />;

  return (
    <>
      <PageHeader
        title="Saving Goals"
        subtitle="Plan for the things that matter and watch your progress grow."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No saving goals yet"
            message="Create a goal like “Save ₹20,000 for a new phone” and track your progress."
            action={
              <Button icon={Plus} onClick={openCreate}>
                Create goal
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-auto">
          {goals.map((g) => (
            <Card key={g.id} className="goal-card" hover>
              <div className="flex between">
                <div className="flex">
                  <span className="budget-card__icon">
                    <Target size={20} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{g.name}</div>
                    {g.status === 'completed' ? (
                      <Badge variant="income">
                        <CheckCircle2 size={12} /> Completed
                      </Badge>
                    ) : g.targetDate ? (
                      <span className="hint flex" style={{ gap: 4 }}>
                        <Calendar size={12} /> {formatDate(g.targetDate)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex">
                  <button className="icon-btn" title="Edit" onClick={() => openEdit(g)}>
                    <Pencil size={15} />
                  </button>
                  <button className="icon-btn" title="Delete" onClick={() => setDeleting(g)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="goal-card__ring">
                <ProgressRing value={g.progressPercent} />
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontWeight: 750, fontSize: '1.2rem' }}>
                    {formatCurrency(g.currentAmount, currency)}
                  </div>
                  <div className="hint">saved of {formatCurrency(g.targetAmount, currency)}</div>
                  <div className="hint" style={{ marginTop: 4 }}>
                    {g.remainingAmount > 0
                      ? `${formatCurrency(g.remainingAmount, currency)} to go`
                      : 'Target reached! 🎉'}
                  </div>
                </div>
              </div>

              <ProgressBar value={g.progressPercent} />
              <Button
                variant="subtle"
                size="sm"
                icon={TrendingUp}
                block
                onClick={() => {
                  setContributing(g);
                  setContribution('');
                }}
              >
                Add contribution
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit goal' : 'New saving goal'}
      >
        <form onSubmit={handleSave} className="col" style={{ display: 'flex', gap: 14 }}>
          <Field label="Goal name">
            <input
              className="input"
              placeholder="e.g. Save for a trip"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="Target amount">
              <input
                className="input mono"
                type="number"
                min="0"
                step="0.01"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              />
            </Field>
            <Field label="Already saved">
              <input
                className="input mono"
                type="number"
                min="0"
                step="0.01"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Target date (optional)">
            <input
              className="input"
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            />
          </Field>
          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create goal'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(contributing)}
        onClose={() => setContributing(null)}
        title={`Add to "${contributing?.name}"`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setContributing(null)}>
              Cancel
            </Button>
            <Button onClick={handleContribution}>Add amount</Button>
          </>
        }
      >
        <Field label="Amount to add" hint="Use a negative value to withdraw">
          <input
            className="input mono"
            type="number"
            step="0.01"
            placeholder="e.g. 2000"
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete goal"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        busy={deletingBusy}
      />
    </>
  );
}
