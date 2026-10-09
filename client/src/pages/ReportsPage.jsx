import { useState } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Scale,
  PieChart,
  Trophy,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useAsync } from '../hooks/useAsync.js';
import { reportApi } from '../api/resources.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, buildQuery } from '../api/apiClient.js';
import {
  Button,
  Card,
  CardHeader,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Spinner,
  StatCard,
} from '../components/common/index.jsx';
import { CategoryDonut, MonthlyComparisonChart } from '../components/charts/index.jsx';
import { CategoryIcon } from '../utils/categories.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

const PERIODS = [
  { value: 'today', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.currency || 'INR';

  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const hasCustomRange = Boolean(from && to);

  const params = from && to ? { from, to } : { period };
  const { data, loading } = useAsync(() => reportApi.spending(params), [JSON.stringify(params)]);
  const { data: suggestionData } = useAsync(() => reportApi.suggestions(), []);

  async function handleExport() {
    try {
      const res = await api.raw(`/reports/export.csv${buildQuery(params)}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  }

  if (loading && !data) return <Spinner center />;
  if (!data) return null;

  const { totals, byCategory, series, topTransactions, comparison } = data;
  const suggestions = suggestionData?.suggestions || [];

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Daily, weekly and monthly summaries with category and comparison reports."
        actions={
          <>
            <Button
              variant="ghost"
              icon={Filter}
              onClick={() => setShowFilters(true)}
            >
              Filters{hasCustomRange ? ' (1)' : ''}
            </Button>
            <Button variant="ghost" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
          </>
        }
      />

      <Drawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Report filters"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setFrom('');
                setTo('');
              }}
            >
              Clear range
            </Button>
            <Button onClick={() => setShowFilters(false)}>Show results</Button>
          </>
        }
      >
        <div className="filter-form">
          <Field label="Quick period">
            <div className="chip-row">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  className={`chip ${period === p.value && !hasCustomRange ? 'active' : ''}`}
                  onClick={() => {
                    setPeriod(p.value);
                    setFrom('');
                    setTo('');
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="From">
            <input
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="To">
            <input
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
      </Drawer>

      <div className="stat-grid">
        <StatCard
          label="Total income"
          value={formatCurrency(totals.income, currency)}
          icon={TrendingUp}
          accent="var(--income)"
        />
        <StatCard
          label="Total expenses"
          value={formatCurrency(totals.expense, currency)}
          icon={TrendingDown}
          accent="var(--expense)"
        />
        <StatCard
          label="Net balance"
          value={formatCurrency(totals.net, currency)}
          icon={Scale}
          accent="var(--brand-1)"
        />
        <StatCard label="Transactions" value={totals.count} icon={BarChart3} accent="var(--info)" />
      </div>

      {comparison ? (
        <Card>
          <CardHeader title="Comparison with previous period" icon={Scale} />
          <div className="card__body">
            <div className="grid grid-2">
              <div className="suggestion-item">
                <span
                  className={`suggestion-icon suggestion-icon--${comparison.expense.changePercent > 0 ? 'high' : 'positive'}`}
                >
                  {comparison.expense.changePercent > 0 ? (
                    <TrendingUp size={17} />
                  ) : (
                    <TrendingDown size={17} />
                  )}
                </span>
                <div>
                  <strong>
                    Expenses {comparison.expense.changePercent >= 0 ? 'increased' : 'decreased'} by{' '}
                    {Math.abs(comparison.expense.changePercent)}%
                  </strong>
                  <p>
                    {formatCurrency(comparison.expense.previous, currency)} →{' '}
                    {formatCurrency(comparison.expense.current, currency)} vs the previous period.
                  </p>
                </div>
              </div>
              <div className="suggestion-item">
                <span
                  className={`suggestion-icon suggestion-icon--${comparison.income.changePercent > 0 ? 'positive' : 'medium'}`}
                >
                  {comparison.income.changePercent > 0 ? (
                    <TrendingUp size={17} />
                  ) : (
                    <TrendingDown size={17} />
                  )}
                </span>
                <div>
                  <strong>
                    Income {comparison.income.changePercent >= 0 ? 'increased' : 'decreased'} by{' '}
                    {Math.abs(comparison.income.changePercent)}%
                  </strong>
                  <p>
                    {formatCurrency(comparison.income.previous, currency)} →{' '}
                    {formatCurrency(comparison.income.current, currency)} vs the previous period.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="chart-grid">
        <Card>
          <CardHeader
            title="Spending trend"
            subtitle="Income vs expense over the range"
            icon={TrendingUp}
          />
          <div className="card__body">
            <MonthlyComparisonChart data={series} currency={currency} />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Category-wise expenditure"
            subtitle="Where your money went"
            icon={PieChart}
          />
          <div className="card__body">
            <CategoryDonut data={byCategory} currency={currency} />
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card>
          <CardHeader title="Category breakdown" icon={BarChart3} />
          <div className="card__body" style={{ paddingTop: 6 }}>
            {byCategory.length ? (
              <div className="col" style={{ display: 'flex', gap: 4 }}>
                {byCategory.map((c) => (
                  <div
                    key={c.categoryId || c.name}
                    className="flex between"
                    style={{ padding: '10px 4px', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="tx-desc">
                      <span className="tx-icon">
                        <CategoryIcon iconKey={c.iconKey} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{c.name}</div>
                        <div className="hint">{c.percent}% of spending</div>
                      </div>
                    </div>
                    <span className="mono" style={{ fontWeight: 700 }}>
                      {formatCurrency(c.total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={BarChart3} title="No data" message="No expenses in this period." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Highest-value transactions" icon={Trophy} />
          <div className="card__body" style={{ paddingTop: 6 }}>
            {topTransactions.length ? (
              <div className="col" style={{ display: 'flex', gap: 4 }}>
                {topTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex between"
                    style={{ padding: '10px 4px', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="tx-desc">
                      <span className="tx-icon">
                        <CategoryIcon iconKey={t.categoryIcon} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{t.description}</div>
                        <div className="hint">
                          {t.category} · {formatDate(t.transactionDate)}
                        </div>
                      </div>
                    </div>
                    <span className="amount-neg mono">{formatCurrency(t.amount, currency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No transactions"
                message="Nothing to rank in this period."
              />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Smart saving suggestions"
          subtitle={
            suggestionData?.period
              ? `${suggestionData.period.previous} → ${suggestionData.period.current}`
              : ''
          }
          icon={Sparkles}
        />
        <div className="card__body" style={{ paddingTop: 8 }}>
          {suggestions.length ? (
            <div className="grid grid-2">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <span className={`suggestion-icon suggestion-icon--${s.severity}`}>
                    {s.type === 'increase' ? (
                      <TrendingUp size={17} />
                    ) : s.type === 'decrease' ? (
                      <TrendingDown size={17} />
                    ) : (
                      <Sparkles size={17} />
                    )}
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>{s.title}</strong>
                    <p>{s.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No suggestions"
              message="Add more data to generate insights."
            />
          )}
        </div>
      </Card>
    </>
  );
}
