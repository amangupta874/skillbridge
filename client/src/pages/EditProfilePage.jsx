import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { getUserById, updateProfile, updateSkills, updateLearningGoals } from '../api/users.js';
import { fieldErrorsFromApiError } from '../api/client.js';
import { getLookups } from '../api/lookups.js';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import SkillPicker from '../components/SkillPicker.jsx';

const LINK_TYPES = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'other', label: 'Other' },
];

export default function EditProfilePage() {
  const { user: authUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const notifySuccess = (msg) => {
    if (toast?.success) toast.success(msg);
    else if (toast?.addToast) toast.addToast(msg, 'success');
    else if (toast?.toast) toast.toast({ message: msg, type: 'success' });
  };

  const userId = authUser?.id || 1;

  // 1. Fetch current profile data
  const {
    data: profileUser,
    isLoading: isProfileLoading,
    error: profileError,
    refetch,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
  });

  // 2. Fetch lookups
  const { data: lookups, error: lookupsError, refetch: refetchLookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: getLookups,
  });

  // --- Section 1: Basic Info State ---
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [errorBasic, setErrorBasic] = useState(null);
  const [basicFieldErrors, setBasicFieldErrors] = useState({});

  // --- Section 2: Links State ---
  const [links, setLinks] = useState([]);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [errorLinks, setErrorLinks] = useState(null);

  // --- Section 3: Interests State ---
  const [selectedInterestIds, setSelectedInterestIds] = useState([]);
  const [isSavingInterests, setIsSavingInterests] = useState(false);
  const [errorInterests, setErrorInterests] = useState(null);

  // --- Section 4: Known Skills State ---
  const [skills, setSkills] = useState([]);
  const [isSavingSkills, setIsSavingSkills] = useState(false);
  const [errorSkills, setErrorSkills] = useState(null);

  // --- Section 5: Learning Goals State ---
  const [learningGoals, setLearningGoals] = useState([]);
  const [isSavingGoals, setIsSavingGoals] = useState(false);
  const [errorGoals, setErrorGoals] = useState(null);

  // Sync state when profileUser loads
  useEffect(() => {
    if (profileUser) {
      setFullName(profileUser.fullName || '');
      setBio(profileUser.bio || '');
      setWeeklyHours(profileUser.weeklyHours != null ? String(profileUser.weeklyHours) : '');
      setCollegeId(profileUser.college?.id ? String(profileUser.college.id) : '');
      setLinks(profileUser.links || []);
      setSelectedInterestIds((profileUser.interests || []).map((i) => i.id));
      setSkills(profileUser.skills || []);
      setLearningGoals(profileUser.learningGoals || []);
    }
  }, [profileUser]);

  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" data-testid="edit-profile-loading">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-slate-500">Loading your profile settings...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <ErrorBanner error={profileError} onRetry={() => refetch()} />
      </div>
    );
  }

  // --- Handlers for independent saving ---

  // Section 1: Basic Info
  const handleSaveBasic = async (e) => {
    e.preventDefault();
    setIsSavingBasic(true);
    setErrorBasic(null);
    setBasicFieldErrors({});

    try {
      const payload = {
        fullName: fullName.trim(),
        bio: bio.trim() || null,
        weeklyHours: weeklyHours ? Number(weeklyHours) : null,
        collegeId: collegeId ? Number(collegeId) : null,
      };

      await updateProfile(payload);
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      notifySuccess('Basic information saved successfully');
    } catch (err) {
      setErrorBasic(err.message || 'Failed to update basic information.');
      setBasicFieldErrors(fieldErrorsFromApiError(err));
    } finally {
      setIsSavingBasic(false);
    }
  };

  // Section 2: Links
  const handleAddLink = () => {
    if (links.length >= 4) return;
    setLinks([...links, { type: 'github', url: '' }]);
  };

  const handleLinkChange = (index, field, val) => {
    const updated = links.map((item, idx) => (idx === index ? { ...item, [field]: val } : item));
    setLinks(updated);
  };

  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, idx) => idx !== index));
  };

  const handleSaveLinks = async (e) => {
    e.preventDefault();
    setIsSavingLinks(true);
    setErrorLinks(null);

    try {
      const validLinks = links.filter((l) => l.url.trim().length > 0);
      await updateProfile({ links: validLinks });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      notifySuccess('Profile links saved successfully');
    } catch (err) {
      setErrorLinks(err.message || 'Failed to update links.');
    } finally {
      setIsSavingLinks(false);
    }
  };

  // Section 3: Interests
  const handleToggleInterest = (id) => {
    if (selectedInterestIds.includes(id)) {
      setSelectedInterestIds(selectedInterestIds.filter((item) => item !== id));
    } else {
      if (selectedInterestIds.length >= 10) return;
      setSelectedInterestIds([...selectedInterestIds, id]);
    }
  };

  const handleSaveInterests = async (e) => {
    e.preventDefault();
    setIsSavingInterests(true);
    setErrorInterests(null);

    try {
      await updateProfile({ interestIds: selectedInterestIds });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      notifySuccess('Interests saved successfully');
    } catch (err) {
      setErrorInterests(err.message || 'Failed to update interests.');
    } finally {
      setIsSavingInterests(false);
    }
  };

  // Section 4: Known Skills
  const handleSaveSkills = async (e) => {
    e.preventDefault();
    setIsSavingSkills(true);
    setErrorSkills(null);

    try {
      const formatted = skills.map((item) => ({
        skillId: item.skill?.id || item.skillId || item.id,
        level: item.level || 'INTERMEDIATE',
      }));

      await updateSkills(formatted);
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      notifySuccess('Known skills saved successfully');
    } catch (err) {
      setErrorSkills(err.message || 'Failed to update skills.');
    } finally {
      setIsSavingSkills(false);
    }
  };

  // Section 5: Learning Goals
  const handleSaveGoals = async (e) => {
    e.preventDefault();
    setIsSavingGoals(true);
    setErrorGoals(null);

    try {
      const skillIds = learningGoals.map((item) => item.id || item.skillId || item);
      await updateLearningGoals(skillIds);
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      notifySuccess('Learning goals saved successfully');
    } catch (err) {
      setErrorGoals(err.message || 'Failed to update learning goals.');
    } finally {
      setIsSavingGoals(false);
    }
  };

  // Calculate excluded ids to prevent mutual overlap
  const knownSkillIds = skills.map((s) => s.skill?.id || s.skillId || s.id).filter(Boolean);
  const learningGoalIds = learningGoals.map((g) => g.id || g.skillId || g).filter(Boolean);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header with back to profile link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal bio, availability, links, skills, and goals. Each section saves independently.
          </p>
        </div>
        <Link to={`/users/${userId}`}>
          <Button variant="secondary" size="md">
            View Public Profile &rarr;
          </Button>
        </Link>
      </div>

      {/* SECTION 1: Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>1. Basic Information</CardTitle>
          <CardDescription>Update your public display name, college, and availability.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveBasic}>
          <CardContent className="space-y-4">
            {errorBasic && <ErrorBanner error={errorBasic} />}
            {lookupsError && <ErrorBanner error={lookupsError} onRetry={() => refetchLookups()} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="fullName"
                name="fullName"
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={80}
                placeholder="Your full name"
                error={basicFieldErrors.fullName}
              />

              <div className="w-full space-y-1">
                <label htmlFor="collegeId" className="block text-sm font-medium text-slate-700">
                  College / University
                </label>
                <select
                  id="collegeId"
                  aria-invalid={Boolean(basicFieldErrors.collegeId)}
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select your college...</option>
                  {lookups?.colleges?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {basicFieldErrors.collegeId && <p role="alert" className="text-xs font-medium text-red-600">{basicFieldErrors.collegeId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="weeklyHours"
                name="weeklyHours"
                type="number"
                min={1}
                max={80}
                label="Weekly Hours Available"
                hint="How many hours per week can you dedicate to projects or exchanges?"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value)}
                placeholder="e.g. 15"
                error={basicFieldErrors.weeklyHours}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
                  Bio / About
                </label>
                <span className="text-2xs text-slate-400">{bio.length} / 500</span>
              </div>
              <textarea
                id="bio"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                aria-invalid={Boolean(basicFieldErrors.bio)}
                placeholder="Tell peers about your background, interests, and what you love building..."
                className="block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              {basicFieldErrors.bio && <p role="alert" className="text-xs font-medium text-red-600">{basicFieldErrors.bio}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <div className="ml-auto">
              <Button type="submit" variant="primary" size="md" loading={isSavingBasic}>
                Save Basic Info
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* SECTION 2: Social & Portfolio Links */}
      <Card>
        <CardHeader>
          <CardTitle>2. Links</CardTitle>
          <CardDescription>Add links to your GitHub profile, LinkedIn, personal website, or portfolio (up to 4).</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveLinks}>
          <CardContent className="space-y-4">
            {errorLinks && <ErrorBanner error={errorLinks} />}

            {links.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No external links added yet.</p>
            ) : (
              <div className="space-y-3">
                {links.map((link, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                      aria-label="Link platform type"
                      value={link.type}
                      onChange={(e) => handleLinkChange(idx, 'type', e.target.value)}
                      className="w-full sm:w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-2xs"
                    >
                      {LINK_TYPES.map((lt) => (
                        <option key={lt.value} value={lt.value}>
                          {lt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      aria-label="Link URL"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                      className="flex-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="shrink-0 text-slate-400 hover:text-red-600 p-2 text-sm font-semibold"
                      aria-label="Remove link"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {links.length < 4 && (
              <Button type="button" variant="secondary" size="sm" onClick={handleAddLink}>
                + Add Link
              </Button>
            )}
          </CardContent>
          <CardFooter>
            <div className="ml-auto">
              <Button type="submit" variant="primary" size="md" loading={isSavingLinks}>
                Save Links
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* SECTION 3: Interests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>3. Interests</CardTitle>
            <span className="text-xs text-slate-500">{selectedInterestIds.length} / 10 selected</span>
          </div>
          <CardDescription>Select topic areas and technologies you are excited about.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveInterests}>
          <CardContent>
            {errorInterests && <ErrorBanner error={errorInterests} className="mb-4" />}

            <div className="flex flex-wrap gap-2">
              {lookups?.interests?.map((interest) => {
                const isSelected = selectedInterestIds.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => handleToggleInterest(interest.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {interest.name} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </CardContent>
          <CardFooter>
            <div className="ml-auto">
              <Button type="submit" variant="primary" size="md" loading={isSavingInterests}>
                Save Interests
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* SECTION 4: Known Skills */}
      <Card>
        <CardHeader>
          <CardTitle>4. Known Skills & Proficiency</CardTitle>
          <CardDescription>
            Add skills you are proficient in and can teach or contribute to projects (up to 30).
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveSkills}>
          <CardContent>
            {errorSkills && <ErrorBanner error={errorSkills} className="mb-4" />}

            <SkillPicker
              label="Select and add skills with proficiency level"
              value={skills}
              onChange={setSkills}
              withLevel={true}
              excludedSkillIds={learningGoalIds}
              maxItems={30}
            />
          </CardContent>
          <CardFooter>
            <div className="ml-auto">
              <Button type="submit" variant="primary" size="md" loading={isSavingSkills}>
                Save Skills
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* SECTION 5: Learning Goals */}
      <Card>
        <CardHeader>
          <CardTitle>5. Learning Goals</CardTitle>
          <CardDescription>
            Skills you want to learn through peer exchanges or upcoming collaborations (up to 15).
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveGoals}>
          <CardContent>
            {errorGoals && <ErrorBanner error={errorGoals} className="mb-4" />}

            <SkillPicker
              label="Select skills you want to learn"
              value={learningGoals}
              onChange={setLearningGoals}
              withLevel={false}
              excludedSkillIds={knownSkillIds}
              maxItems={15}
            />
          </CardContent>
          <CardFooter>
            <div className="ml-auto">
              <Button type="submit" variant="primary" size="md" loading={isSavingGoals}>
                Save Learning Goals
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
