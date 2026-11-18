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
  return (
    <label className="block text-sm text-slate-700">
      <span className="flex justify-between gap-2"><span>{label}</span><span className="font-semibold tabular-nums">{value}</span></span>
      <meter
        min={0}
        max={100}
        value={value}
        className={`mt-1 block w-full [&::-webkit-meter-bar]:rounded-full [&::-webkit-meter-bar]:border-0 [&::-webkit-meter-bar]:bg-slate-100 [&::-webkit-meter-optimum-value]:rounded-full [&::-webkit-meter-optimum-value]:bg-indigo-600 [&::-moz-meter-bar]:bg-indigo-600 ${small ? 'h-2' : 'h-3'}`}
      />
    </label>
  );
}

export default function MatchCard({ match: { user, score, breakdown, reasons } }) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          <Link to={`/users/${user.id}`} className="text-indigo-700 hover:underline">{user.fullName}</Link>
        </h2>
        {user.college && <p className="text-sm text-slate-600">{user.college.name}</p>}
      </div>
      {user.topSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {user.topSkills.map(({ skill, level }) => <SkillBadge key={skill.id} skill={skill} level={level} />)}
        </div>
      )}
      <ScoreBar label="Match score" value={score} />
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(breakdownLabels).map(([part, label]) => (
          <ScoreBar key={part} label={label} value={breakdown[part]} small />
        ))}
      </div>
      {reasons.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {reasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      )}
    </Card>
  );
}
