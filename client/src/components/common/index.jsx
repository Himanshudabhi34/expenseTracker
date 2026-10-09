import { useEffect, useState } from 'react';
import { X, Loader2, Inbox, Lock, Eye, EyeOff } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size,
  block,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...props}>
      {Icon ? <Icon size={16} /> : null}
      {children}
      {IconRight ? <IconRight size={16} /> : null}
    </button>
  );
}

export function Card({ children, className = '', hover, padded, ...props }) {
  const classes = ['card', hover ? 'card--hover' : '', padded ? 'card--padded' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="card__header">
      <div>
        <div className="card__title">
          {Icon ? <Icon size={17} /> : null}
          {title}
        </div>
        {subtitle ? <div className="card__subtitle">{subtitle}</div> : null}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = 'var(--brand-1)', hint, trend }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-card__top">
        <div className="stat-card__icon">{Icon ? <Icon size={20} /> : null}</div>
      </div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value mono">{value}</div>
      {hint ? (
        <div
          className={`stat-card__hint ${trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : ''}`}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function Badge({ children, variant = '' }) {
  return <span className={`badge ${variant ? `badge--${variant}` : ''}`}>{children}</span>;
}

export function ProgressBar({ value = 0, variant }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const cls =
    variant || (pct >= 100 ? 'progress__bar--danger' : pct >= 80 ? 'progress__bar--warning' : '');
  return (
    <div className="progress">
      <div className={`progress__bar ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Spinner({ center }) {
  return <div className={`spinner ${center ? 'spinner--center' : ''}`} />;
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex wrap">{actions}</div> : null}
    </div>
  );
}

export function Field({ label, error, children, full, hint }) {
  return (
    <div className={`field ${full ? 'field--full' : ''}`}>
      {label ? <label className="label">{label}</label> : null}
      {children}
      {hint && !error ? <span className="hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  autoComplete = 'current-password',
  placeholder = '••••••••',
  withLock = true,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-group">
      {withLock ? <Lock size={16} className="input-group__icon" /> : null}
      <input
        className="input input--with-action"
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      <button
        type="button"
        className="input-group__action"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={() => onClose?.()}>
      <div
        className={`modal ${wide ? 'modal--wide' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal__header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, side = 'right' }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={() => onClose?.()}>
      <aside
        className={`drawer ${side === 'left' ? 'drawer--left' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="drawer__header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer ? <div className="drawer__footer">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  onConfirm,
  onCancel,
  busy,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={busy}
            icon={busy ? Loader2 : undefined}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      <p className="text-soft">{message}</p>
    </Modal>
  );
}

export function Loader2Spin() {
  return <Loader2 size={16} className="spin" />;
}
