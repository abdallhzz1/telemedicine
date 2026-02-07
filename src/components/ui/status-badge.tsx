import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusClasses: Record<string, string> = {
  upcoming: 'badge-upcoming',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  active: 'badge-completed',
  disabled: 'badge-cancelled',
  new: 'badge-upcoming',
  in_progress: 'badge-pending',
  ready: 'badge-completed',
  rejected: 'badge-cancelled',
  pending: 'badge-pending',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  
  const statusKey = status.replace('_', '');
  const translatedStatus = t(`status.${status === 'in_progress' ? 'inProgress' : status}`, status);
  
  return (
    <span className={cn(statusClasses[status] || 'badge-status', className)}>
      {translatedStatus}
    </span>
  );
}
