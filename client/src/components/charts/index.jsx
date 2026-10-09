import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/format.js';
import { CATEGORY_COLORS } from '../../utils/categories.jsx';

const axisProps = {
  stroke: 'var(--text-muted)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const gridStroke = 'var(--border)';

function TooltipBox({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: 'var(--shadow)',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}
        >
          <span style={{ textTransform: 'capitalize' }}>{p.name}</span>
          <span className="mono">{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

export function SpendingTrendChart({ data = [], currency = 'INR' }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
        <Tooltip content={<TooltipBox currency={currency} />} />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#incomeFill)"
          name="income"
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#expenseFill)"
          name="expense"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseBarChart({ data = [], currency = 'INR' }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
        <Tooltip content={<TooltipBox currency={currency} />} cursor={{ fill: 'var(--bg-soft)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" maxBarSize={34} />
        <Bar
          dataKey="expense"
          fill="#ef4444"
          radius={[6, 6, 0, 0]}
          name="Expense"
          maxBarSize={34}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyComparisonChart({ data = [], currency = 'INR' }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
        <Tooltip content={<TooltipBox currency={currency} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke="#ef4444"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          name="Expense"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data = [], currency = 'INR' }) {
  if (!data.length) {
    return (
      <div className="empty">
        <p>No category data for this period.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="name"
          innerRadius={62}
          outerRadius={96}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.categoryId || index}
              fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatCurrency(value, currency), name]}
          contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default {
  SpendingTrendChart,
  IncomeExpenseBarChart,
  MonthlyComparisonChart,
  CategoryDonut,
};
