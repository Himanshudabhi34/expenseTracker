import { AlertTriangle, CheckCircle2, Info, Target, Receipt } from 'lucide-react';

export const NOTIFICATION_ICONS = {
  budget_warning: AlertTriangle,
  budget_exceeded: AlertTriangle,
  goal_completed: Target,
  large_transaction: Receipt,
  monthly_summary: Info,
  default: CheckCircle2,
};

export function notificationIcon(type) {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
}

export default NOTIFICATION_ICONS;
