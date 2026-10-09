import { Link } from 'react-router-dom';
import { Bot, TrendingUp, PiggyBank, ShieldCheck } from 'lucide-react';

export default function AuthShell({ children }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="auth-aside__brand">
          <div
            className="auth-aside__brand-mark sidebar__brand-mark"
            style={{ width: 40, height: 40 }}
          >
            ₹
          </div>
          Daily Expense Tracker
        </div>

        <div className="auth-aside__hero">
          <h1>Understand your money, effortlessly.</h1>
          <p>
            Record income and expenses, set budgets and goals, and ask your built-in expense
            assistant questions in plain English.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature__icon">
                <Bot size={17} />
              </span>
              Natural-language entries &amp; instant answers
            </div>
            <div className="auth-feature">
              <span className="auth-feature__icon">
                <TrendingUp size={17} />
              </span>
              Beautiful dashboards and spending insights
            </div>
            <div className="auth-feature">
              <span className="auth-feature__icon">
                <PiggyBank size={17} />
              </span>
              Budgets, saving goals and smart suggestions
            </div>
            <div className="auth-feature">
              <span className="auth-feature__icon">
                <ShieldCheck size={17} />
              </span>
              Your data stays private and scoped to you
            </div>
          </div>
        </div>

        <div className="auth-aside__foot">Built with the MERN stack · No paid AI required</div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          {children}
          <div className="auth-switch">
            <Link to="/">Back to home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
