import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Filter,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAsync } from '../hooks/useAsync.js';
import { transactionApi } from '../api/transaction.api.js';
import { categoryApi } from '../api/resources.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Drawer,
  EmptyState,
  PageHeader,
  Spinner,
  Field,
} from '../components/common/index.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import { CategoryIcon, PAYMENT_METHODS } from '../utils/categories.jsx';
import { formatCurrency, formatDate, paymentMethodLabel } from '../utils/format.js';
import { api, buildQuery } from '../api/apiClient.js';

const initialFilters = {
  search: '',
  type: '',
  categoryId: '',
  paymentMethod: '',
  from: '',
  to: '',
  minAmount: '',
  maxAmount: '',
  sort: 'date_desc',
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.currency || 'INR';
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  useEffect(() => {
    if (location.state?.openForm) {
      setEditing(null);
      setFormOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const query = useMemo(() => {
    const q = { ...filters, page, limit: 20 };
    Object.keys(q).forEach((k) => (q[k] === '' || q[k] == null) && delete q[k]);
    return q;
  }, [filters, page]);

  const { data: catData } = useAsync(() => categoryApi.list(), []);
  const { data, loading, reload } = useAsync(
    () => transactionApi.list(query),
    [JSON.stringify(query)]
  );

  const categories = catData?.categories || [];
  const transactions = data?.items || [];
  const pagination = data?.pagination;

  function setFilter(patch) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function resetFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

  async function handleSave(payload) {
    setSaving(true);
    try {
      if (editing) {
        await transactionApi.update(editing._id, payload);
        toast.success('Transaction updated');
      } else {
        await transactionApi.create(payload);
        toast.success('Transaction added');
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Could not save transaction');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeletingBusy(true);
    try {
      await transactionApi.remove(deleting._id);
      toast.success('Transaction deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    } finally {
      setDeletingBusy(false);
    }
  }

  async function handleExport() {
    try {
      const { page: _p, limit: _l, ...exportFilters } = query;
      const res = await api.raw(`/reports/export.csv${buildQuery(exportFilters)}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  }

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v !== '' && v !== initialFilters[k]
  ).length;

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Search, filter and manage all your income and expenses."
        actions={
          <>
            <Button variant="ghost" icon={Filter} onClick={() => setShowFilters((s) => !s)}>
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
            <Button variant="ghost" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add transaction
            </Button>
          </>
        }
      />

      <Drawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        footer={
          <>
            <Button variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={() => setShowFilters(false)}>Show results</Button>
          </>
        }
      >
        <div className="filter-form">
          <Field label="Search">
              <div className="input-group">
                <Search size={16} className="input-group__icon" />
                <input
                  className="input"
                  placeholder="Description or merchant"
                  value={filters.search}
                  onChange={(e) => setFilter({ search: e.target.value })}
                />
              </div>
            </Field>
            <Field label="Type">
              <select
                className="select"
                value={filters.type}
                onChange={(e) => setFilter({ type: e.target.value })}
              >
                <option value="">All</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </Field>
            <Field label="Category">
              <select
                className="select"
                value={filters.categoryId}
                onChange={(e) => setFilter({ categoryId: e.target.value })}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payment method">
              <select
                className="select"
                value={filters.paymentMethod}
                onChange={(e) => setFilter({ paymentMethod: e.target.value })}
              >
                <option value="">All</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="From">
              <input
                className="input"
                type="date"
                value={filters.from}
                onChange={(e) => setFilter({ from: e.target.value })}
              />
            </Field>
            <Field label="To">
              <input
                className="input"
                type="date"
                value={filters.to}
                onChange={(e) => setFilter({ to: e.target.value })}
              />
            </Field>
            <Field label="Min amount">
              <input
                className="input mono"
                type="number"
                min="0"
                value={filters.minAmount}
                onChange={(e) => setFilter({ minAmount: e.target.value })}
              />
            </Field>
            <Field label="Max amount">
              <input
                className="input mono"
                type="number"
                min="0"
                value={filters.maxAmount}
                onChange={(e) => setFilter({ maxAmount: e.target.value })}
              />
            </Field>
            <Field label="Sort by">
              <select
                className="select"
                value={filters.sort}
                onChange={(e) => setFilter({ sort: e.target.value })}
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="amount_desc">Highest amount</option>
                <option value="amount_asc">Lowest amount</option>
              </select>
            </Field>
        </div>
      </Drawer>

      <Card>
        <CardHeader
          title="All transactions"
          subtitle={pagination ? `${pagination.total} record(s)` : ''}
          icon={Receipt}
        />
        <div className="card__body" style={{ paddingTop: 8 }}>
          {loading && !data ? (
            <Spinner center />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions found"
              message="Try adjusting your filters or add a new transaction."
              action={
                <Button icon={Plus} onClick={() => setFormOpen(true)}>
                  Add transaction
                </Button>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td>
                        <div className="tx-desc">
                          <span className="tx-icon">
                            <CategoryIcon iconKey={tx.categoryId?.iconKey} />
                          </span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{tx.description}</div>
                            {tx.merchant ? <div className="hint">{tx.merchant}</div> : null}
                          </div>
                        </div>
                      </td>
                      <td>{tx.categoryId?.name || 'Uncategorized'}</td>
                      <td className="mono">{formatDate(tx.transactionDate)}</td>
                      <td>{paymentMethodLabel(tx.paymentMethod)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={tx.type === 'income' ? 'amount-pos' : 'amount-neg'}>
                          {tx.type === 'income' ? '+' : '−'}
                          {formatCurrency(tx.amountMinor / 100, tx.currency || currency)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() => {
                              setEditing(tx);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-btn"
                            title="Delete"
                            onClick={() => setDeleting(tx)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.total > 0 ? (
            <div className="pagination">
              <span>
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
              </span>
              <div className="pagination__controls">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight={ChevronRight}
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <TransactionForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        categories={categories}
        initial={editing}
        busy={saving}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete transaction"
        message={`Are you sure you want to delete "${deleting?.description}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        busy={deletingBusy}
      />
    </>
  );
}
