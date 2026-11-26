import { useId } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card.jsx';
import SkillBadge from './SkillBadge.jsx';

const breakdownLabels = {
  coverage: 'Required skills',
  proficiency: 'Skill level',
  gapFill: 'Fills a gap',
  learning: 'Wants to learn',
};

function ScoreBar({ label, value, small = false }) {
  const id = useId();
  return (
    <div className="text-sm text-slate-700">
      <label htmlFor={id} className="flex justify-between gap-2"><span>{label}</span><span aria-hidden="true" className="font-semibold tabular-nums">{value}</span></label>
      <meter
        id={id}
        min={0}
        max={100}
        value={value}
        className={`mt-1 block w-full [&::-webkit-meter-bar]:rounded-full [&::-webkit-meter-bar]:border-0 [&::-webkit-meter-bar]:bg-slate-100 [&::-webkit-meter-optimum-value]:rounded-full [&::-webkit-meter-optimum-value]:bg-indigo-600 [&::-moz-meter-bar]:bg-indigo-600 ${small ? 'h-2' : 'h-3'}`}
      />
    </div>
  );
}

export default function MatchCard({ match: { user, score, breakdown, reasons } }) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          <Link to={`/users/${user.id}`} className="text-indigo-700 hover:underline">{user.fullName}</Link>
        </h2>
        {user.college && <p className="text-sm text-slate-700">{user.college.name}</p>}
      </div>
      {user.topSkills.length > 0 && (
        <ul role="list" className="flex flex-wrap gap-2">
          {user.topSkills.map(({ skill, level }) => <li key={skill.id}><SkillBadge skill={skill} level={level} /></li>)}
        </ul>
      )}
      <ScoreBar label="Match score" value={score} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(breakdownLabels).map(([part, label]) => (
          <ScoreBar key={part} label={label} value={breakdown[part]} small />
        ))}
      </div>
      {reasons.length > 0 && (
        <ul aria-label="Match reasons" className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {reasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      )}
    </Card>
  );
}
