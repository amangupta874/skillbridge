import { useParams, Link, useNavigate } from 'react-router-dom';
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

export default function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

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
      <div className="flex flex-col items-center justify-center py-20" data-testid="profile-loading">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-slate-500">Loading student profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-8 max-w-xl mx-auto">
        <ErrorBanner error={error} onRetry={() => refetch()} />
        <div className="text-center pt-2">
          <Link to="/people">
            <Button variant="secondary" size="sm">
              Back to People
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <EmptyState
          title="Student not found"
          description="The requested student profile could not be found or does not exist."
          actionLabel="Browse People"
          onAction={() => navigate('/people')}
        />
      </div>
    );
  }

  const isOwnProfile = currentUser && Number(currentUser.id) === Number(profileUser.id);

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
      <Card className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900" data-testid="profile-name">
                {profileUser.fullName}
              </h1>
              {profileUser.college && (
                <p className="text-sm font-medium text-slate-600 mt-0.5">
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
                  <span className="text-xs text-slate-500">
                    Member since {formatDate(profileUser.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {isOwnProfile ? (
              <Link to="/profile/edit">
                <Button variant="secondary" size="md">
                  Edit Profile
                </Button>
              </Link>
            ) : (
              <Link to={`/exchanges?recipientId=${profileUser.id}`}>
                <Button variant="primary" size="md">
                  Request skill exchange
                </Button>
              </Link>
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
                <p className="text-sm italic text-slate-400">No biography provided yet.</p>
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
                <div className="flex flex-wrap gap-2.5">
                  {profileUser.skills.map((item) => (
                    <SkillBadge
                      key={item.skill?.id || item.skill?.name}
                      skill={item.skill}
                      level={item.level}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">No skills listed yet.</p>
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
                <div className="flex flex-wrap gap-2">
                  {profileUser.learningGoals.map((goal) => (
                    <Badge key={goal.id} variant="INFO" size="md">
                      {goal.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">No learning goals listed yet.</p>
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
                <div className="flex flex-wrap gap-2">
                  {profileUser.interests.map((interest) => (
                    <Badge key={interest.id} variant="DEFAULT" size="md">
                      {interest.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">No interests listed.</p>
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
                <ul className="space-y-3">
                  {profileUser.links.map((link) => (
                    <li key={link.type} className="flex flex-col text-xs">
                      <span className="font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        {link.type}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline truncate"
                      >
                        {link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-slate-400">No links added.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
