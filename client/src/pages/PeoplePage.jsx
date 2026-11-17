import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api/users.js';
import { getSkills } from '../api/skills.js';
import Card from '../components/Card.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 12;

export default function PeoplePage() {
  const [query, setQuery] = useState('');
  const [skillId, setSkillId] = useState('');
  const [page, setPage] = useState(1);
  const filters = { ...(query.trim() && { query: query.trim() }), ...(skillId && { skillId }), page, limit: PAGE_SIZE };
  const usersQuery = useQuery({ queryKey: ['users', filters], queryFn: () => getUsers(filters) });
  const skillsQuery = useQuery({ queryKey: ['skills', 'people-filter'], queryFn: () => getSkills({ limit: 100 }) });

  function changeQuery(value) {
    setQuery(value);
    setPage(1);
  }

  function changeSkill(value) {
    setSkillId(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Find people</h1>
        <p className="mt-1 text-sm text-slate-600">Meet students by name or skill.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Search by name" name="query" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search students" />
        <Select label="Filter by skill" name="skillId" value={skillId} onChange={(event) => changeSkill(event.target.value)} disabled={skillsQuery.isLoading || Boolean(skillsQuery.error)}>
          <option value="">All skills</option>
          {(skillsQuery.data ?? []).map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
        </Select>
      </div>
      {skillsQuery.error && <ErrorBanner error={skillsQuery.error} onRetry={() => skillsQuery.refetch()} />}
      {usersQuery.isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {usersQuery.error && <ErrorBanner error={usersQuery.error} onRetry={() => usersQuery.refetch()} />}
      {usersQuery.data?.items?.length === 0 && <EmptyState title="No people found" description="Try another name or skill." />}
      {usersQuery.data?.items?.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usersQuery.data.items.map((person) => (
              <Card key={person.id} className="flex h-full flex-col p-5">
                <h2 className="text-lg font-semibold text-slate-900">{person.fullName}</h2>
                <p className="mt-1 min-h-5 text-sm text-slate-600">{person.college?.name ?? 'College not listed'}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {person.topSkills?.length ? person.topSkills.map(({ skill, level }) => <SkillBadge key={skill.id} skill={skill} level={level} />) : <span className="text-sm text-slate-500">No skills listed</span>}
                </div>
                <Link to={`/users/${person.id}`} className="mt-5 inline-flex text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline">View profile</Link>
              </Card>
            ))}
          </div>
          <Pagination page={usersQuery.data.meta.page} totalPages={usersQuery.data.meta.totalPages} onPageChange={setPage} label="People pages" />
        </>
      )}
    </div>
  );
}
