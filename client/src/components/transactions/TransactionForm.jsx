import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button, Field, Modal } from '../common/index.jsx';
import { PAYMENT_METHODS } from '../../utils/categories.jsx';
import { toInputDate } from '../../utils/format.js';

const empty = {
  type: 'expense',
  amount: '',
  categoryId: '',
  description: '',
  merchant: '',
  transactionDate: toInputDate(),
  paymentMethod: 'other',
  notes: '',
};

export default function TransactionForm({
  open,
  onClose,
  onSubmit,
  categories = [],
  initial,
  busy,
}) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      if (initial) {
        setForm({
          type: initial.type,
          amount: initial.amountMinor != null ? initial.amountMinor / 100 : '',
          categoryId: initial.categoryId?._id || initial.categoryId || '',
          description: initial.description || '',
          merchant: initial.merchant || '',
          transactionDate: toInputDate(initial.transactionDate),
          paymentMethod: initial.paymentMethod || 'other',
          notes: initial.notes || '',
        });
      } else {
        setForm(empty);
      }
    }
  }, [open, initial]);

  const relevantCategories = categories.filter((c) => c.type === form.type || c.type === 'both');

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Enter an amount greater than zero');
      return;
    }
    if (!form.categoryId) {
      setError('Please choose a category');
      return;
    }
    if (!form.description.trim()) {
      setError('Please add a description');
      return;
    }
    await onSubmit({
      type: form.type,
      amount: Number(form.amount),
      categoryId: form.categoryId,
      description: form.description.trim(),
      merchant: form.merchant.trim(),
      transactionDate: form.transactionDate,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit transaction' : 'Add transaction'}
      wide
    >
      <form onSubmit={handleSubmit} className="col" style={{ display: 'flex', gap: 16 }}>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${form.type === 'expense' ? 'active' : ''}`}
            onClick={() => update({ type: 'expense', categoryId: '' })}
          >
            Expense
          </button>
          <button
            type="button"
            className={`chip ${form.type === 'income' ? 'active' : ''}`}
            onClick={() => update({ type: 'income', categoryId: '' })}
          >
            Income
          </button>
        </div>

        <div className="form-grid">
          <Field label="Amount">
            <input
              className="input mono"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => update({ amount: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              className="input"
              type="date"
              value={form.transactionDate}
              onChange={(e) => update({ transactionDate: e.target.value })}
            />
          </Field>
          <Field label="Category">
            <select
              className="select"
              value={form.categoryId}
              onChange={(e) => update({ categoryId: e.target.value })}
            >
              <option value="">Select category…</option>
              {relevantCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Payment method">
            <select
              className="select"
              value={form.paymentMethod}
              onChange={(e) => update({ paymentMethod: e.target.value })}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" full>
            <input
              className="input"
              placeholder="e.g. Lunch at office canteen"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Field>
          <Field label="Merchant (optional)" full>
            <input
              className="input"
              placeholder="e.g. Swiggy"
              value={form.merchant}
              onChange={(e) => update({ merchant: e.target.value })}
            />
          </Field>
          <Field label="Notes (optional)" full>
            <textarea
              className="textarea"
              placeholder="Any additional details…"
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </Field>
        </div>

        {error ? <span className="field-error">{error}</span> : null}

        <div className="flex between">
          <span className="hint">Amount is stored securely as integer minor units.</span>
          <div className="flex">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" icon={Save} disabled={busy}>
              {busy ? 'Saving…' : initial ? 'Save changes' : 'Add transaction'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
