import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProject, updateProject } from '../api/projects.js';
import { applyToProject, updateApplicationStatus } from '../api/applications.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import Textarea from '../components/Textarea.jsx';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatLabel } from '../utils/labels.js';
import { projectStatusTransitions } from '../utils/projectStatus.js';
import { applicationSchema } from '../schemas/application.schema.js';
import { fieldErrorsFromApiError } from '../api/client.js';

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const { id } = useParams();
  const {
    register: registerApplication,
    handleSubmit: handleApplicationSubmit,
    setError: setApplicationError,
    reset: resetApplication,
    formState: { errors: applicationErrors },
  } = useForm({ resolver: zodResolver(applicationSchema), defaultValues: { message: '' } });
  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id),
    enabled: Boolean(id),
  });
  const changeStatus = useMutation({
    mutationFn: (status) => updateProject(id, { status }),
    onSuccess: async (updatedProject) => {
      setPendingStatus(null);
      toast.success(`Project status changed to ${formatLabel(updatedProject.status)}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project', id] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
      ]);
    },
    onError: (statusError) => {
      setPendingStatus(null);
      toast.error(statusError.message);
    },
  });
  const sendApplication = useMutation({
    mutationFn: (message) => applyToProject(id, message),
    onSuccess: async () => {
      setShowApplyDialog(false);
      resetApplication();
      toast.success('Your application was sent.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project', id] }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
      ]);
    },
    onError: (applicationError) => {
      const fieldErrors = fieldErrorsFromApiError(applicationError);
      if (fieldErrors.message) setApplicationError('message', { type: 'server', message: fieldErrors.message });
      else toast.error(applicationError.message);
    },
  });
  const withdrawApplication = useMutation({
    mutationFn: () => updateApplicationStatus(project.myApplication.id, 'WITHDRAWN'),
    onSuccess: async () => {
      setConfirmWithdraw(false);
      toast.success('Your application was withdrawn.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project', id] }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
      ]);
    },
    onError: (withdrawError) => {
      setConfirmWithdraw(false);
      toast.error(withdrawError.message);
    },
  });

  if (isLoading) {
    return <div className="flex flex-col items-center gap-3 py-16"><Spinner size="lg" /><p className="text-sm text-slate-500">Loading project...</p></div>;
  }
  if (error?.status === 404) {
    return <EmptyState title="Project not found" description="This project may have been removed or is not available to you." actionLabel="Browse projects" onAction={() => navigate('/projects')} />;
  }
  if (error) return <ErrorBanner error={error} onRetry={() => refetch()} />;
  if (!project) {
    return <EmptyState title="Project not found" description="This project may have been removed or is not available to you." actionLabel="Browse projects" onAction={() => navigate('/projects')} />;
  }

  const seatsUsedPercent = Math.min(100, Math.round((project.seatsTaken / project.maxTeamSize) * 100));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/projects" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">← Back to projects</Link>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-700">{project.category.name}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{project.title}</h1>
          </div>
          {project.myRole === 'OWNER' && (
            <Link to={`/projects/${project.id}/edit`}><Button variant="secondary">Edit</Button></Link>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={project.status}>{formatLabel(project.status)}</Badge>
          <Badge variant={project.difficulty}>{formatLabel(project.difficulty)}</Badge>
        </div>
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">About this project</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{project.description}</p>
        </section>
        <section className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <h2 className="font-semibold text-slate-900">Team seats</h2>
            <span className="text-slate-600">{project.seatsTaken} of {project.maxTeamSize} filled · {project.seatsLeft} left</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Team seats filled" aria-valuemin="0" aria-valuemax={project.maxTeamSize} aria-valuenow={project.seatsTaken}>
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${seatsUsedPercent}%` }} />
          </div>
        </section>
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">Required skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.skills.map((skill) => <SkillBadge key={skill.id} skill={skill} level={formatLabel(skill.minLevel)} />)}
          </div>
        </section>
        {project.myRole === 'OWNER' && projectStatusTransitions[project.status].length > 0 && (
          <section className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold text-slate-900">Project status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {projectStatusTransitions[project.status].map((status) => (
                <Button key={status} variant={status === 'ARCHIVED' ? 'danger' : 'secondary'} disabled={changeStatus.isPending} onClick={() => setPendingStatus(status)}>
                  {formatLabel(status)}
                </Button>
              ))}
            </div>
          </section>
        )}
        {project.myRole === 'OWNER' ? (
          <section className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            <Link to={`/projects/${project.id}/matches`} className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Find teammates</Link>
            <Link to={`/projects/${project.id}/applications`}><Button variant="secondary">View applications</Button></Link>
          </section>
        ) : (
          <section className="mt-6 border-t border-slate-100 pt-5">
            {project.myApplication?.status === 'PENDING' ? (
              <Button variant="secondary" onClick={() => setConfirmWithdraw(true)}>Withdraw application</Button>
            ) : ['ACCEPTED', 'REJECTED'].includes(project.myApplication?.status) ? (
              <Badge variant={project.myApplication.status}>{formatLabel(project.myApplication.status)}</Badge>
            ) : project.status === 'OPEN' && !project.isFull ? (
              <Button onClick={() => setShowApplyDialog(true)}>Apply</Button>
            ) : (
              <p className="text-sm text-slate-600">{project.isFull ? 'This project is full.' : 'This project is not accepting applications.'}</p>
            )}
          </section>
        )}
      </Card>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Project owner</h2>
          <p className="mt-2 text-sm text-slate-700">{project.owner.fullName}</p>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Team members</h2>
          {project.members.length ? (
            <ul className="mt-2 space-y-2">{project.members.map((member) => <li key={member.id} className="text-sm text-slate-700">{member.fullName}</li>)}</ul>
          ) : <p className="mt-2 text-sm text-slate-500">No members have joined yet.</p>}
        </Card>
      </div>
      {(project.hoursPerWeek != null || project.deadline || project.githubUrl || project.demoUrl) && (
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Project details</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {project.hoursPerWeek != null && <div><dt className="font-medium text-slate-500">Time needed</dt><dd className="mt-1 text-slate-800">{project.hoursPerWeek} hours per week</dd></div>}
            {project.deadline && <div><dt className="font-medium text-slate-500">Deadline</dt><dd className="mt-1 text-slate-800">{new Date(project.deadline).toLocaleDateString()}</dd></div>}
            {project.githubUrl && <div><dt className="font-medium text-slate-500">GitHub</dt><dd className="mt-1"><a className="break-all text-indigo-700 underline" href={project.githubUrl} target="_blank" rel="noreferrer">{project.githubUrl}</a></dd></div>}
            {project.demoUrl && <div><dt className="font-medium text-slate-500">Demo</dt><dd className="mt-1"><a className="break-all text-indigo-700 underline" href={project.demoUrl} target="_blank" rel="noreferrer">{project.demoUrl}</a></dd></div>}
          </dl>
        </Card>
      )}
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={`Change project status to ${formatLabel(pendingStatus || '')}?`}
        message={pendingStatus === 'ARCHIVED' ? 'Archived projects can no longer be edited.' : `This will move the project to ${formatLabel(pendingStatus || '')}.`}
        confirmLabel={`Set to ${formatLabel(pendingStatus || '')}`}
        danger={pendingStatus === 'ARCHIVED'}
        loading={changeStatus.isPending}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => changeStatus.mutate(pendingStatus)}
      />
      <Modal open={showApplyDialog} title="Apply to this project" onClose={() => !sendApplication.isPending && setShowApplyDialog(false)}>
        <form className="space-y-4" onSubmit={handleApplicationSubmit(({ message }) => sendApplication.mutate(message))} noValidate>
          <Textarea
            label="Message to the project owner"
            name="message"
            required
            rows={5}
            minLength={10}
            maxLength={500}
            hint="Tell the owner how you can help (10 to 500 characters)."
            error={applicationErrors.message?.message}
            {...registerApplication('message')}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" disabled={sendApplication.isPending} onClick={() => setShowApplyDialog(false)}>Cancel</Button>
            <Button type="submit" loading={sendApplication.isPending}>Send application</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmWithdraw}
        title="Withdraw your application?"
        message="The project owner will no longer see your application as pending. You can apply again later."
        confirmLabel="Withdraw application"
        danger
        loading={withdrawApplication.isPending}
        onCancel={() => setConfirmWithdraw(false)}
        onConfirm={() => withdrawApplication.mutate()}
      />
    </div>
  );
}
