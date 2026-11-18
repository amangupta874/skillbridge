import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAllNotificationsRead } from '../api/notifications.js';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import NotificationList from '../components/NotificationList.jsx';
import Pagination from '../components/Pagination.jsx';
import Spinner from '../components/Spinner.jsx';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const filters = { page, limit: 12, ...(unreadOnly && { unread: true }) };
  const notificationsQuery = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => getNotifications(filters),
  });
  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      if (unreadOnly) setPage(1);
      return queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  function toggleUnread(event) {
    setUnreadOnly(event.target.checked);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <Button variant="secondary" loading={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
          Mark all as read
        </Button>
      </header>
      <label className="flex w-fit items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={unreadOnly} onChange={toggleUnread} className="size-4 accent-indigo-600" />
        Unread only
      </label>
      <ErrorBanner error={markAllRead.error} />
      {notificationsQuery.isLoading && <Spinner />}
      {notificationsQuery.error && <ErrorBanner error={notificationsQuery.error} onRetry={() => notificationsQuery.refetch()} />}
      {notificationsQuery.isSuccess && (
        <>
          {notificationsQuery.data.items.length > 0 ? (
            <NotificationList notifications={notificationsQuery.data.items} />
          ) : (
            <EmptyState
              title={unreadOnly ? 'You have no unread notifications' : 'You have no notifications yet'}
              actionLabel={page > 1 ? 'Back to first page' : undefined}
              onAction={() => setPage(1)}
            />
          )}
          <Pagination
            label="Notification pages"
            page={notificationsQuery.data.meta.page}
            totalPages={notificationsQuery.data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
