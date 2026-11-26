import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { getUnreadCount } from '../api/notifications.js';

export default function NotificationBell({ onClick }) {
  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const count = unreadQuery.data?.count ?? 0;
  const label = count ? `Notifications, ${count} unread` : 'Notifications';

  return (
    <div className="flex items-center gap-1">
      <NavLink
        to="/notifications"
        onClick={onClick}
        aria-label={unreadQuery.error ? `${label}, unread count unavailable` : label}
        className={({ isActive }) =>
          `relative inline-flex shrink-0 rounded-lg p-2 focus-visible:outline-2 focus-visible:outline-indigo-600 ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`
        }
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4" />
        </svg>
        {count > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-4 rounded-full bg-indigo-700 px-1 text-center text-[10px] font-semibold leading-4 text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </NavLink>
      {unreadQuery.error && (
        <button type="button" onClick={() => unreadQuery.refetch()} disabled={unreadQuery.isFetching} aria-label="Retry unread notification count" className="rounded text-xs font-medium text-slate-700 underline">
          Retry
        </button>
      )}
    </div>
  );
}
