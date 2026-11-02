import { describe, test, expect } from 'vitest';
import { scoreCandidate } from './scoreCandidate.js';

const REACT = 1, NODE = 2, POSTGRES = 3, FIGMA = 9;

describe('scoreCandidate', () => {
  test('worked example from the design document gives 53 with the expected reasons', () => {
    const result = scoreCandidate({
      requiredSkills: [
        { skillId: REACT, name: 'React', minLevel: 'INTERMEDIATE' },
        { skillId: NODE, name: 'Node.js', minLevel: 'INTERMEDIATE' },
        { skillId: POSTGRES, name: 'PostgreSQL', minLevel: 'BEGINNER' },
      ],
      candidateSkills: [
        { skillId: REACT, level: 'INTERMEDIATE' },
        { skillId: NODE, level: 'BEGINNER' },
        { skillId: FIGMA, level: 'INTERMEDIATE' },
      ],
      candidateGoalSkillIds: [POSTGRES],
      teamSkillIds: [NODE, POSTGRES],
    });

    expect(result.score).toBe(53);
    expect(result.breakdown).toEqual({ coverage: 50, proficiency: 50, gapFill: 100, learning: 33.3 });
    expect(result.reasons).toEqual([
      'React: intermediate level meets the requirement',
      'Node.js: known, but below the required intermediate level',
      'Adds 1 skill(s) the team does not have yet',
      'Wants to learn PostgreSQL',
    ]);
  });

  test('an advanced candidate who fills every gap scores 90 (learning part is 0)', () => {
    const result = scoreCandidate({
      requiredSkills: [{ skillId: REACT, name: 'React', minLevel: 'INTERMEDIATE' }],
      candidateSkills: [{ skillId: REACT, level: 'ADVANCED' }],
      candidateGoalSkillIds: [],
      teamSkillIds: [],
    });
    expect(result.score).toBe(90);
  });

  test('a candidate with no relevant skills scores 0', () => {
    const result = scoreCandidate({
      requiredSkills: [{ skillId: REACT, name: 'React', minLevel: 'BEGINNER' }],
      candidateSkills: [{ skillId: FIGMA, level: 'ADVANCED' }],
      candidateGoalSkillIds: [],
      teamSkillIds: [],
    });
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
  });

  test('a project without required skills returns 0 and says why', () => {
    const result = scoreCandidate({ requiredSkills: [], candidateSkills: [], candidateGoalSkillIds: [], teamSkillIds: [] });
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual(['This project has no required skills yet']);
  });
});
