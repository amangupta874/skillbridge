import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import Card from './Card.jsx';
import SkillBadge from './SkillBadge.jsx';
import { formatLabel } from '../utils/labels.js';

export default function ProjectCard({ project }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-indigo-700">{project.category.name}</p>
        <Badge variant={project.status}>{formatLabel(project.status)}</Badge>
      </div>
      <h2 className="mt-3 text-lg font-bold text-slate-900">
        <Link to={`/projects/${project.id}`} className="rounded-sm hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600">
          {project.title}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{project.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant={project.difficulty}>{formatLabel(project.difficulty)}</Badge>
        <span className="text-sm font-medium text-slate-700">
          {project.seatsLeft} {project.seatsLeft === 1 ? 'seat' : 'seats'} left
        </span>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Required skills</p>
        <div className="flex flex-wrap gap-2">
          {project.skills.map((skill) => (
            <SkillBadge key={skill.id} skill={skill} level={skill.minLevel} />
          ))}
        </div>
      </div>
      <p className="mt-auto pt-5 text-sm text-slate-500">Owner: <span className="font-medium text-slate-700">{project.owner.fullName}</span></p>
    </Card>
  );
}
