import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createProject, getProject, updateProject } from '../api/projects.js';
import { getLookups } from '../api/lookups.js';
import Button from '../components/Button.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import SkillPicker from '../components/SkillPicker.jsx';
import Spinner from '../components/Spinner.jsx';
import Textarea from '../components/Textarea.jsx';
import { fieldErrorsFromApiError } from '../api/client.js';
import { projectFormDefaults, projectFormSchema } from '../schemas/project.schema.js';
import { formatLabel } from '../utils/labels.js';

const projectLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const projectFields = ['title', 'description', 'categoryId', 'difficulty', 'maxTeamSize', 'hoursPerWeek', 'deadline', 'githubUrl', 'demoUrl', 'skills'];

function toProjectBody(values, status, isEditing) {
  const body = {
    title: values.title.trim(),
    description: values.description.trim(),
    categoryId: Number(values.categoryId),
    difficulty: values.difficulty,
    maxTeamSize: Number(values.maxTeamSize),
    skills: values.skills.map(({ skill, level }) => ({ skillId: skill.id, minLevel: level })),
  };

  if (values.hoursPerWeek !== undefined) body.hoursPerWeek = values.hoursPerWeek;
  else if (isEditing) body.hoursPerWeek = null;
  if (values.deadline) body.deadline = new Date(values.deadline).toISOString();
  else if (isEditing) body.deadline = null;
  if (values.githubUrl) body.githubUrl = values.githubUrl;
  else if (isEditing) body.githubUrl = null;
  if (values.demoUrl) body.demoUrl = values.demoUrl;
  else if (isEditing) body.demoUrl = null;
  if (status) body.status = status;

  return body;
}

function projectFormValues(project) {
  return {
    title: project.title,
    description: project.description,
    categoryId: String(project.category.id),
    difficulty: project.difficulty,
    maxTeamSize: project.maxTeamSize,
    hoursPerWeek: project.hoursPerWeek ?? '',
    deadline: project.deadline ? project.deadline.slice(0, 10) : '',
    githubUrl: project.githubUrl || '',
    demoUrl: project.demoUrl || '',
    skills: project.skills.map((skill) => ({
      skill: { id: skill.id, name: skill.name },
      level: skill.minLevel,
    })),
  };
}

export default function ProjectFormPage({ edit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(projectFormSchema), defaultValues: projectFormDefaults });

  const lookupsQuery = useQuery({ queryKey: ['lookups'], queryFn: getLookups });
  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id),
    enabled: edit && Boolean(id),
  });

  useEffect(() => {
    if (edit && projectQuery.data?.myRole === 'OWNER') reset(projectFormValues(projectQuery.data));
  }, [edit, projectQuery.data, reset]);

  const saveProject = useMutation({
    mutationFn: ({ body }) => edit ? updateProject(id, body) : createProject(body),
    onSuccess: async (project) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['project', project.id] }),
      ]);
      navigate(`/projects/${project.id}`);
    },
    onError: (error) => {
      const fieldErrors = fieldErrorsFromApiError(error);
      let foundFieldError = false;
      for (const [field, message] of Object.entries(fieldErrors)) {
        if (projectFields.includes(field) || field.startsWith('skills.')) {
          setError(field, { type: 'server', message });
          foundFieldError = true;
        }
      }
      setSaveError(foundFieldError ? null : error);
    },
  });

  if (edit && projectQuery.isLoading) {
    return <div className="flex flex-col items-center gap-3 py-16"><Spinner size="lg" /><p className="text-sm text-slate-500">Loading project...</p></div>;
  }
  if (edit && projectQuery.error?.status === 404) {
    return <div className="mx-auto max-w-xl space-y-4 py-12 text-center"><h1 className="text-xl font-semibold text-slate-900">You are not allowed to edit this project</h1><p className="text-sm text-slate-600">The project may not exist or may not be available to you.</p><Link to="/projects" className="font-medium text-indigo-700 underline">Browse projects</Link></div>;
  }
  if (edit && projectQuery.error) return <ErrorBanner error={projectQuery.error} onRetry={() => projectQuery.refetch()} />;
  if (edit && projectQuery.data?.myRole !== 'OWNER') {
    return <div className="mx-auto max-w-xl space-y-4 py-12 text-center"><h1 className="text-xl font-semibold text-slate-900">You are not allowed to edit this project</h1><Link to={`/projects/${id}`} className="font-medium text-indigo-700 underline">Back to project</Link></div>;
  }
  if (edit && ['COMPLETED', 'ARCHIVED'].includes(projectQuery.data?.status)) {
    return <div className="mx-auto max-w-xl space-y-4 py-12 text-center"><h1 className="text-xl font-semibold text-slate-900">This project can no longer be edited</h1><Link to={`/projects/${id}`} className="font-medium text-indigo-700 underline">Back to project</Link></div>;
  }

  function submitForm(values, event) {
    if (saveProject.isPending) return;
    setSaveError(null);
    const status = edit ? undefined : event?.nativeEvent?.submitter?.value || 'DRAFT';
    saveProject.mutate({ body: toProjectBody(values, status, edit) });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link to={edit ? `/projects/${id}` : '/projects'} className="text-sm font-medium text-indigo-700 hover:text-indigo-900">← {edit ? 'Back to project' : 'Back to projects'}</Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{edit ? 'Edit project' : 'Create a project'}</h1>
      </header>
      {lookupsQuery.error && <ErrorBanner error={lookupsQuery.error} onRetry={() => lookupsQuery.refetch()} />}
      {saveError && <ErrorBanner error={saveError} />}
      <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7" onSubmit={handleSubmit(submitForm)} noValidate>
        <Input name="title" label="Project title" required maxLength={100} hint="5 to 100 characters." error={errors.title?.message} {...register('title')} />
        <Textarea name="description" label="Description" required rows={6} maxLength={2000} hint="20 to 2000 characters." error={errors.description?.message} {...register('description')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select name="categoryId" label="Category" required disabled={lookupsQuery.isLoading || !lookupsQuery.data} error={errors.categoryId?.message} {...register('categoryId')}>
            <option value="">Choose a category</option>
            {(lookupsQuery.data?.projectCategories || []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select name="difficulty" label="Difficulty" required error={errors.difficulty?.message} {...register('difficulty')}>
            {projectLevels.map((level) => <option key={level} value={level}>{formatLabel(level)}</option>)}
          </Select>
        </div>
        <Input name="maxTeamSize" label="Maximum team size" type="number" required min={2} max={10} hint="This includes the project owner." error={errors.maxTeamSize?.message} {...register('maxTeamSize')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input name="hoursPerWeek" label="Hours per week" type="number" min={1} max={60} hint="Optional, from 1 to 60 hours." error={errors.hoursPerWeek?.message} {...register('hoursPerWeek')} />
          <Input name="deadline" label="Deadline" type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} hint="Optional. Choose a future date." error={errors.deadline?.message} {...register('deadline')} />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input name="githubUrl" label="GitHub URL" type="url" placeholder="https://github.com/..." hint="Optional. Must start with https://." error={errors.githubUrl?.message} {...register('githubUrl')} />
          <Input name="demoUrl" label="Demo URL" type="url" placeholder="https://..." hint="Optional. Must start with https://." error={errors.demoUrl?.message} {...register('demoUrl')} />
        </div>
        <Controller
          name="skills"
          control={control}
          render={({ field }) => <SkillPicker value={field.value} onChange={field.onChange} withLevel maxItems={10} levels={projectLevels} label="Required skills" error={errors.skills?.message} />}
        />
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          {edit ? (
            <Button type="submit" value="OPEN" loading={saveProject.isPending}>Save changes</Button>
          ) : (
            <>
              <Button type="submit" value="DRAFT" variant="secondary" disabled={saveProject.isPending}>Save as draft</Button>
              <Button type="submit" value="OPEN" loading={saveProject.isPending}>Publish</Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
