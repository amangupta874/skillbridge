import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserById } from '../api/users.js';
import { useAuth } from '../context/AuthContext.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import Button from '../components/Button.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../utils/date.js';
import { useState } from 'react';
import RequestExchangeDialog from '../components/RequestExchangeDialog.jsx';
import PageState from '../components/PageState.jsx';
import usePageTitle from '../utils/usePageTitle.js';

export default function PublicProfilePage() {
  usePageTitle('Student profile');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);

  const {
    data: profileUser,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <PageState title="Student profile">
        <Spinner size="lg" />
      </PageState>
    );
  }

  if (error && error.status !== 404) {
    return (
      <PageState title="Student profile">
        <ErrorBanner error={error} onRetry={() => refetch()} />
        <div className="text-center pt-2">
          <Button to="/people" variant="secondary" size="sm">Back to People</Button>
        </div>
      </PageState>
    );
  }

  if (!profileUser || error?.status === 404) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <EmptyState
          heading="h1" title="Student not found"
          description="The requested student profile could not be found or does not exist."
          actionLabel="Browse People"
          onAction={() => navigate('/people')}
        />
      </div>
    );
  }

  const isOwnProfile = currentUser && String(currentUser.id) === String(profileUser.id);

  // Compute initials for avatar
  const initials = profileUser.fullName
    ? profileUser.fullName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SB';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <Card className="sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <div aria-hidden="true" className="flex size-12 shrink-0 sm:size-20 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-sm">
              {initials}
            </div>
            <div>
              <h1 tabIndex={-1} className="text-2xl font-bold tracking-tight text-slate-900" data-testid="profile-name">
                {profileUser.fullName}
              </h1>
              {profileUser.college && (
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {profileUser.college.name}
                </p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {profileUser.weeklyHours != null && (
                  <Badge variant="INFO" size="sm">
                    {profileUser.weeklyHours} hrs/week available
                  </Badge>
                )}
                {profileUser.createdAt && (
                  <span className="text-xs text-slate-700">
                    Member since {formatDate(profileUser.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {isOwnProfile ? (
              <Button to="/profile/edit" variant="secondary" size="md">Edit Profile</Button>
            ) : (
              <Button variant="primary" size="md" aria-haspopup="dialog" onClick={() => setExchangeDialogOpen(true)}>
                Request skill exchange
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content (Left 2 cols) */}
        <div className="md:col-span-2 space-y-8">
          {/* About / Bio */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.bio ? (
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {profileUser.bio}
                </p>
              ) : (
                <p className="text-sm italic text-slate-700">No biography provided yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Known Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Known Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.skills && profileUser.skills.length > 0 ? (
                <ul role="list" className="flex flex-wrap gap-2.5">
                  {profileUser.skills.map((item) => (
                    <li key={item.skill?.id || item.skill?.name}><SkillBadge
                      skill={item.skill}
                      level={item.level}
                    /></li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-slate-700">No skills listed yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Learning Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.learningGoals && profileUser.learningGoals.length > 0 ? (
                <ul role="list" className="flex flex-wrap gap-2">
                  {profileUser.learningGoals.map((goal) => (
                    <li key={goal.id}><Badge variant="INFO" size="md">
                      {goal.name}
                    </Badge></li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-slate-700">No learning goals listed yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info (Right 1 col) */}
        <div className="space-y-8">
          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.interests && profileUser.interests.length > 0 ? (
                <ul role="list" className="flex flex-wrap gap-2">
                  {profileUser.interests.map((interest) => (
                    <li key={interest.id}><Badge variant="DEFAULT" size="md">
                      {interest.name}
                    </Badge></li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-slate-700">No interests listed.</p>
              )}
            </CardContent>
          </Card>

          {/* External Links */}
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.links && profileUser.links.length > 0 ? (
                <ul role="list" className="space-y-3">
                  {profileUser.links.map((link) => (
                    <li key={link.type} className="flex flex-col text-xs">
                      <span className="font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                        {link.type}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-700 hover:text-indigo-800 hover:underline truncate"
                      >
                        {link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-slate-700">No links added.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {!isOwnProfile && <RequestExchangeDialog open={exchangeDialogOpen} onClose={() => setExchangeDialogOpen(false)} currentUserId={currentUser?.id} recipient={profileUser} />}
    </div>
  );
}

