import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getExchanges, updateExchangeStatus } from '../api/exchanges.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import ExchangeCard from '../components/ExchangeCard.jsx';
import Select from '../components/Select.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import usePageTitle from '../utils/usePageTitle.js';

const PAGE_SIZE = 12;
const BOXES = [
  { value: 'all', label: 'All' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

export default function ExchangesPage() {
  usePageTitle('Skill exchanges');
  const [box, setBox] = useState('all');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const filters = { box, ...(status && { status }), page, limit: PAGE_SIZE };
  const exchangesQuery = useQuery({ queryKey: ['exchanges', filters], queryFn: () => getExchanges(filters) });
  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updateExchangeStatus(id, nextStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      toast.success('Exchange updated');
    },
    onError: (error) => toast.error(error.message),
  });

  function selectBox(nextBox) {
    setBox(nextBox);
    setPage(1);
  }

  function selectStatus(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 tabIndex={-1} className="text-2xl font-bold text-slate-900">Skill exchanges</h1>
        <p className="mt-1 text-sm text-slate-700">Manage requests to share and learn skills.</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Exchange requests">
          {BOXES.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={box === tab.value} onClick={() => selectBox(tab.value)} className={`rounded-lg px-3 py-2 text-sm font-medium ${box === tab.value ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{tab.label}</button>)}
        </div>
        <div className="w-full sm:w-52">
          <Select label="Filter by status" name="status" value={status} onChange={selectStatus}>
            <option value="">All statuses</option>
            {['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((value) => <option key={value} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>)}
          </Select>
        </div>
      </div>
      {exchangesQuery.isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {exchangesQuery.error && <ErrorBanner error={exchangesQuery.error} onRetry={() => exchangesQuery.refetch()} />}
      {exchangesQuery.data?.items?.length === 0 && (
        <div className="space-y-4">
          <EmptyState title="No exchange requests yet" description="Find someone to trade skills with." />
          <p className="text-center"><Link to="/people" className="text-sm font-medium text-indigo-700 hover:underline">Browse people</Link></p>
        </div>
      )}
      {exchangesQuery.data?.items?.length > 0 && (
        <>
          <ul role="list" className="space-y-4">
            {exchangesQuery.data.items.map((exchange) => (
              <li key={exchange.id}>
                <ExchangeCard
                  exchange={exchange}
                  currentUserId={user?.id}
                  onStatusChange={(id, nextStatus) => statusMutation.mutateAsync({ id, nextStatus })}
                  saving={statusMutation.isPending}
                  error={statusMutation.variables?.id === exchange.id ? statusMutation.error : null}
                  failedStatus={statusMutation.variables?.nextStatus}
                  onCancelError={statusMutation.reset}
                />
              </li>
            ))}
          </ul>
          <Pagination page={exchangesQuery.data.meta.page} totalPages={exchangesQuery.data.meta.totalPages} onPageChange={setPage} label="Exchange pages" />
        </>
      )}
    </div>
  );
}
