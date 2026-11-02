// Pure function: no database, no HTTP. Easy to unit test and easy to explain in the code defence.
// Score = 0.60 * coverage + 0.20 * proficiency + 0.10 * gapFill + 0.10 * learning  (each part is 0..100)

const LEVEL_VALUE = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
export const WEIGHTS = { coverage: 0.6, proficiency: 0.2, gapFill: 0.1, learning: 0.1 };

const round1 = (number) => Math.round(number * 10) / 10;
const lower = (text) => text.toLowerCase();

/**
 * @param {object} input
 * @param {{skillId:number, name:string, minLevel:'BEGINNER'|'INTERMEDIATE'|'ADVANCED'}[]} input.requiredSkills
 * @param {{skillId:number, level:'BEGINNER'|'INTERMEDIATE'|'ADVANCED'}[]} input.candidateSkills
 * @param {number[]} input.candidateGoalSkillIds  skills the candidate wants to learn
 * @param {Iterable<number>} input.teamSkillIds   skills already covered by the owner and current members
 */
export function scoreCandidate({ requiredSkills, candidateSkills, candidateGoalSkillIds, teamSkillIds }) {
  if (requiredSkills.length === 0) {
    return {
      score: 0,
      breakdown: { coverage: 0, proficiency: 0, gapFill: 0, learning: 0 },
      reasons: ['This project has no required skills yet'],
    };
  }

  const candidateLevelBySkillId = new Map(candidateSkills.map((skill) => [skill.skillId, skill.level]));
  const goalSkillIds = new Set(candidateGoalSkillIds);
  const teamSkillIdSet = new Set(teamSkillIds);
  const reasons = [];

  let coveragePoints = 0;   // 1 point if level is high enough, 0.5 if known but too low
  let proficiencyTotal = 0; // sum of level/3 for the required skills the candidate knows
  let matchedCount = 0;

  for (const required of requiredSkills) {
    const candidateLevel = candidateLevelBySkillId.get(required.skillId);
    if (!candidateLevel) continue;

    matchedCount += 1;
    proficiencyTotal += LEVEL_VALUE[candidateLevel] / 3;

    if (LEVEL_VALUE[candidateLevel] >= LEVEL_VALUE[required.minLevel]) {
      coveragePoints += 1;
      reasons.push(`${required.name}: ${lower(candidateLevel)} level meets the requirement`);
    } else {
      coveragePoints += 0.5;
      reasons.push(`${required.name}: known, but below the required ${lower(required.minLevel)} level`);
    }
  }

  const coverage = (coveragePoints / requiredSkills.length) * 100;
  const proficiency = matchedCount > 0 ? (proficiencyTotal / matchedCount) * 100 : 0;

  // Gap fill: required skills that nobody on the team has yet, and this candidate does.
  const uncoveredSkills = requiredSkills.filter((required) => !teamSkillIdSet.has(required.skillId));
  const gapsFilled = uncoveredSkills.filter((required) => candidateLevelBySkillId.has(required.skillId));
  const gapFill = uncoveredSkills.length > 0 ? (gapsFilled.length / uncoveredSkills.length) * 100 : 0;
  if (gapsFilled.length > 0) reasons.push(`Adds ${gapsFilled.length} skill(s) the team does not have yet`);

  // Learning alignment: required skills the candidate wants to learn but does not know yet.
  const learningTargets = requiredSkills.filter(
    (required) => goalSkillIds.has(required.skillId) && !candidateLevelBySkillId.has(required.skillId),
  );
  const learning = (learningTargets.length / requiredSkills.length) * 100;
  for (const target of learningTargets) reasons.push(`Wants to learn ${target.name}`);

  const score = Math.round(
    WEIGHTS.coverage * coverage +
      WEIGHTS.proficiency * proficiency +
      WEIGHTS.gapFill * gapFill +
      WEIGHTS.learning * learning,
  );

  return {
    score,
    breakdown: {
      coverage: round1(coverage),
      proficiency: round1(proficiency),
      gapFill: round1(gapFill),
      learning: round1(learning),
    },
    reasons,
  };
}
