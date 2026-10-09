import { useState } from 'react';
import { Plus, PiggyBank, Pencil, Trash2, Wallet, TrendingUp } from 'lucide-react';
import { useAsync } from '../hooks/useAsync.js';
import { budgetApi, categoryApi } from '../api/resources.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  ProgressBar,
  Spinner,
  Badge,
} from '../components/common/index.jsx';
import { CategoryIcon } from '../utils/categories.jsx';
import { formatCurrency } from '../utils/format.js';
import { IncomeExpenseBarChart } from '../components/charts/index.jsx';

const emptyForm = { name: '', amount: '', categoryId: '', warningThresholds: '80,100' };

export default function BudgetsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.currency || 'INR';

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const { data, loading, reload } = useAsync(() => budgetApi.list(), []);
  const { data: catData } = useAsync(() => categoryApi.list(), []);
  const { data: historyData } = useAsync(() => budgetApi.history(6), []);

  const budgets = data?.budgets || [];
  const categories = (catData?.categories || []).filter((c) => c.type !== 'income');
  const history = historyData?.history || [];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(budget) {
    setEditing(budget);
    setForm({
      name: budget.name,
      amount: budget.amount,
      categoryId: budget.category?._id || '',
      warningThresholds: (budget.warningThresholds || [80, 100]).join(','),
    });
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a valid budget amount');
      return;
    }
    const thresholds = form.warningThresholds
      .split(',')
      .map((n) => Number(n.trim()))
      .filter((n) => n > 0 && n <= 100);
    const payload = {
      name: form.name.trim() || (form.categoryId ? 'Category Budget' : 'Monthly Budget'),
      amount: Number(form.amount),
      categoryId: form.categoryId || null,
      warningThresholds: thresholds.length ? thresholds : undefined,
    };
    setSaving(true);
    try {
      if (editing) {
        await budgetApi.update(editing.id, payload);
        toast.success('Budget updated');
      } else {
        await budgetApi.create(payload);
        toast.success('Budget created');
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Could not save budget');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeletingBusy(true);
    try {
      await budgetApi.remove(deleting.id);
      toast.success('Budget deleted');
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
        title="Budgets"
        subtitle="Set monthly and category budgets, and get alerts at 80% and 100%."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New budget
          </Button>
        }
      />

      {budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={PiggyBank}
            title="No budgets yet"
            message="Create your first monthly or category budget to stay on track."
            action={
              <Button icon={Plus} onClick={openCreate}>
                Create budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-auto">
          {budgets.map((b) => (
            <Card key={b.id} className="budget-card" hover>
              <div className="budget-card__top">
                <div className="flex">
                  <span className="budget-card__icon">
                    {b.category ? (
                      <CategoryIcon iconKey={b.category.iconKey} size={20} />
                    ) : (
                      <Wallet size={20} />
                    )}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.name}</div>
                    <div className="hint">{b.category ? b.category.name : 'Overall spending'}</div>
                  </div>
                </div>
                <div className="flex">
                  <Badge
                    variant={b.percent >= 100 ? 'expense' : b.percent >= 80 ? 'warning' : 'income'}
                  >
                    {b.percent}%
                  </Badge>
                  <button className="icon-btn" title="Edit" onClick={() => openEdit(b)}>
                    <Pencil size={15} />
                  </button>
                  <button className="icon-btn" title="Delete" onClick={() => setDeleting(b)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <ProgressBar value={b.percent} />
              <div className="budget-card__meta">
                <span>
                  Spent <strong className="mono">{formatCurrency(b.spent, currency)}</strong>
                </span>
                <span>
                  of <strong className="mono">{formatCurrency(b.amount, currency)}</strong>
                </span>
              </div>
              <div className="hint" style={{ marginTop: 8 }}>
                {b.remaining > 0
                  ? `${formatCurrency(b.remaining, currency)} remaining this month`
                  : `Over budget by ${formatCurrency(Math.abs(b.remaining), currency)}`}
                {' · '}Alerts at {b.warningThresholds.join('%, ')}%
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title="Historical budget performance"
          subtitle="Total monthly expenses over the last 6 months"
          icon={TrendingUp}
        />
        <div className="card__body">
          {history.length ? (
            <IncomeExpenseBarChart
              data={history.map((h) => ({
                label: h.periodKey.slice(5),
                expense: h.spent,
                income: h.budget,
              }))}
              currency={currency}
            />
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No history yet"
              message="History appears once you record transactions."
            />
          )}
        </div>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit budget' : 'New budget'}
      >
        <form onSubmit={handleSave} className="col" style={{ display: 'flex', gap: 14 }}>
          <Field label="Budget name">
            <input
              className="input"
              placeholder="e.g. Monthly Budget"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Amount">
            <input
              className="input mono"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Category" hint="Leave blank for an overall monthly budget">
            <select
              className="select"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Overall (all categories)</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Warning thresholds (%)" hint="Comma separated, e.g. 80,100">
            <input
              className="input"
              value={form.warningThresholds}
              onChange={(e) => setForm({ ...form, warningThresholds: e.target.value })}
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
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create budget'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete budget"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        busy={deletingBusy}
      />
    </>
  );
}
