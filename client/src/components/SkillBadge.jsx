import Badge from './Badge.jsx';

export default function SkillBadge({
  skill,
  level,
  className = '',
}) {
  const skillName = typeof skill === 'string' ? skill : skill?.name || 'Skill';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-xs text-slate-800 shadow-2xs ${className}`}
    >
      <span className="font-medium text-slate-900">{skillName}</span>
      {level && (
        <Badge variant={level} size="sm">
          {level}
        </Badge>
      )}
    </div>
  );
}

