import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Scale,
  PiggyBank,
  Crown,
  ArrowRight,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { useAsync } from '../hooks/useAsync.js';
import { dashboardApi } from '../api/resources.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAgent } from '../context/AgentContext.jsx';
import {
  Card,
  CardHeader,
  PageHeader,
  Spinner,
  StatCard,
  ProgressBar,
  Badge,
  EmptyState,
} from '../components/common/index.jsx';
import { SpendingTrendChart, MonthlyComparisonChart } from '../components/charts/index.jsx';
import { CategoryIcon } from '../utils/categories.jsx';
import { formatCurrency, formatDate, paymentMethodLabel } from '../utils/format.js';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { openAgent } = useAgent();
  const currency = user?.currency || 'INR';
  const [period, setPeriod] = useState('month');
  const { data, loading } = useAsync(() => dashboardApi.summary(period), [period]);
  const { data: suggestionData } = useAsync(() => dashboardApi.suggestions(), []);

  if (loading && !data) return <Spinner center />;
  if (!data) return null;

  const budget = data.budget || {};
  const suggestions = suggestionData?.suggestions || [];

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle="Here is your financial snapshot."
        actions={
          <div className="chip-row">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                className={`chip ${period === p.value ? 'active' : ''}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Today's expenses"
          value={formatCurrency(data.todayExpense, currency)}
          icon={CalendarDays}
          accent="var(--expense)"
        />
        <StatCard
          label="This month's expenses"
          value={formatCurrency(data.monthExpense, currency)}
          icon={TrendingDown}
          accent="var(--warning)"
        />
        <StatCard
          label="This month's income"
          value={formatCurrency(data.monthIncome, currency)}
          icon={TrendingUp}
          accent="var(--income)"
        />
        <StatCard
          label={`Net balance (${period})`}
          value={formatCurrency(data.netBalance, currency)}
          icon={Scale}
          accent="var(--brand-1)"
        />
      </div>

      <div className="chart-grid">
        <Card>
          <CardHeader
            title="Spending trend"
            subtitle="Income vs expense over the last 14 days"
            icon={TrendingUp}
          />
          <div className="card__body">
            <div className="chart-legend" style={{ marginBottom: 8 }}>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#10b981' }} /> Income
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }} /> Expense
              </span>
            </div>
            <SpendingTrendChart data={data.dailySeries} currency={currency} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Budget remaining" subtitle="This month" icon={PiggyBank} />
          <div className="card__body">
            {budget.total > 0 ? (
              <>
                <div className="flex between" style={{ marginBottom: 10 }}>
                  <div>
                    <div className="hint">Remaining</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 750 }} className="mono">
                      {formatCurrency(budget.remaining, currency)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      budget.percent >= 100
                        ? 'expense'
                        : budget.percent >= 80
                          ? 'warning'
                          : 'income'
                    }
                  >
                    {budget.percent}% used
                  </Badge>
                </div>
                <ProgressBar value={budget.percent} />
                <div className="budget-card__meta">
                  <span>Spent {formatCurrency(budget.spent, currency)}</span>
                  <span>of {formatCurrency(budget.total, currency)}</span>
                </div>
                <Link
                  to="/budgets"
                  className="link-btn"
                  style={{ marginTop: 14, display: 'inline-block' }}
                >
                  Manage budgets →
                </Link>
              </>
            ) : (
              <EmptyState
                icon={PiggyBank}
                title="No budget set"
                message="Create a monthly budget to track your limits."
                action={
                  <Link className="btn btn--primary btn--sm" to="/budgets">
                    Set a budget
                  </Link>
                }
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card>
          <CardHeader title="Income vs expense" subtitle="Last 6 months" icon={Scale} />
          <div className="card__body">
            <MonthlyComparisonChart data={data.monthlySeries} currency={currency} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent transactions"
            icon={Wallet}
            actions={
              <Link to="/transactions" className="link-btn">
                View all
              </Link>
            }
          />
          <div className="card__body" style={{ paddingTop: 6 }}>
            {data.recentTransactions?.length ? (
              <div className="col" style={{ gap: 4, display: 'flex' }}>
                {data.recentTransactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex between"
                    style={{ padding: '11px 4px', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="tx-desc">
                      <span className="tx-icon">
                        <CategoryIcon iconKey={tx.categoryId?.iconKey} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{tx.description}</div>
                        <div className="hint">
                          {tx.categoryId?.name || 'Uncategorized'} ·{' '}
                          {paymentMethodLabel(tx.paymentMethod)} · {formatDate(tx.transactionDate)}
                        </div>
                      </div>
                    </div>
                    <span className={tx.type === 'income' ? 'amount-pos' : 'amount-neg'}>
                      {tx.type === 'income' ? '+' : '−'}
                      {formatCurrency(tx.amountMinor / 100, tx.currency || currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No transactions yet"
                message="Add your first transaction to get started."
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card>
          <CardHeader title="Highest spending category" subtitle="This month" icon={Crown} />
          <div className="card__body">
            {data.highestCategory ? (
              <div className="flex between">
                <div className="flex">
                  <span className="tx-icon" style={{ width: 46, height: 46 }}>
                    <CategoryIcon iconKey={data.highestCategory.iconKey} size={22} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {data.highestCategory.name}
                    </div>
                    <div className="hint">{data.highestCategory.count} transaction(s)</div>
                  </div>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: '1.35rem', fontWeight: 750, color: 'var(--expense)' }}
                >
                  {formatCurrency(data.highestCategory.total, currency)}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Crown}
                title="No spending this month"
                message="Your top category will appear here."
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Smart suggestions"
            subtitle={
              suggestionData?.period
                ? `${suggestionData.period.previous} → ${suggestionData.period.current}`
                : ''
            }
            icon={Sparkles}
            actions={
              <Link to="/reports" className="link-btn">
                Reports
              </Link>
            }
          />
          <div className="card__body" style={{ paddingTop: 8 }}>
            {suggestions.length ? (
              <div className="col" style={{ gap: 10, display: 'flex' }}>
                {suggestions.slice(0, 2).map((s, i) => (
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
                title="No insights yet"
                message="Add more transactions to see personalized suggestions."
              />
            )}
            <button
              type="button"
              className="link-btn"
              onClick={openAgent}
              style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Ask the expense agent <ArrowRight size={14} />
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
