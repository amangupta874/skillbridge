import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { markNotificationRead } from '../api/notifications.js';
import { formatRelativeTime } from '../utils/date.js';
import ErrorBanner from './ErrorBanner.jsx';

export default function NotificationList({ notifications }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  function openNotification(event, notification) {
    if (notification.isRead || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    if (markRead.isPending) return;

    markRead.mutate(notification.id, { onSuccess: () => navigate(notification.link) });
  }

  return (
    <>
      <ErrorBanner error={markRead.error} className="mb-3" />
      <ul className="space-y-2">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <Link
              to={notification.link}
              onClick={(event) => openNotification(event, notification)}
              className={`block rounded-lg border p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${notification.isRead ? 'border-slate-200 bg-white hover:bg-slate-50' : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'}`}
            >
              <span className={`block text-slate-900 ${notification.isRead ? '' : 'font-semibold'}`}>{notification.message}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-600">
                <time dateTime={notification.createdAt}>{formatRelativeTime(notification.createdAt)}</time>
                {!notification.isRead && <span className="font-medium text-indigo-700">Unread</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
