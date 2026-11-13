import { useState, useEffect, useRef } from 'react';
import { getSkills } from '../api/skills.js';
import ErrorBanner from './ErrorBanner.jsx';

const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

export default function SkillPicker({
  value = [],
  onChange,
  withLevel = false,
  excludedSkillIds = [],
  maxItems = 30,
  label = 'Add Skills',
  error = null,
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('INTERMEDIATE');
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const containerRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch skill suggestions when query changes
  useEffect(() => {
    let active = true;

    async function fetchSkills() {
      setIsLoading(true);
      try {
        const results = await getSkills({ query: query.trim(), limit: 10 });
        if (active) {
          setSearchError(null);
          setSuggestions(results || []);
        }
      } catch (error) {
        if (active) {
          setSuggestions([]);
          setSearchError(error);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (query.trim().length > 0) {
      fetchSkills();
    } else {
      setSuggestions([]);
    }

    return () => {
      active = false;
    };
  }, [query]);

  // Check if a skill ID is already selected
  const isSelected = (skillId) => {
    if (withLevel) {
      return value.some((item) => (item.skill?.id || item.skillId) === skillId);
    }
    return value.some((item) => (item.id || item) === skillId);
  };

  // Add skill to selected value
  const handleAddSkill = (skill) => {
    if (value.length >= maxItems) return;
    if (isSelected(skill.id)) return;
    if (excludedSkillIds.includes(skill.id)) return;

    if (withLevel) {
      const newItem = {
        skill: { id: skill.id, name: skill.name, category: skill.category },
        level: selectedLevel,
      };
      onChange?.([...value, newItem]);
    } else {
      const newItem = { id: skill.id, name: skill.name, category: skill.category };
      onChange?.([...value, newItem]);
    }

    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  // Remove skill
  const handleRemoveSkill = (indexToRemove) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange?.(updated);
  };

  // Update level for a known skill
  const handleLevelChange = (index, newLevel) => {
    const updated = value.map((item, idx) => {
      if (idx === index) {
        return { ...item, level: newLevel };
      }
      return item;
    });
    onChange?.(updated);
  };

  const isLimitReached = value.length >= maxItems;

  return (
    <div className={`space-y-3 ${className}`} ref={containerRef}>
      {searchError && <ErrorBanner error={searchError} />}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700" htmlFor="skill-picker-input">
            {label}
          </label>
          <span className="text-xs text-slate-400">
            {value.length} / {maxItems}
          </span>
        </div>
      )}

      {/* Input controls */}
      {!isLimitReached ? (
        <div className="flex flex-col sm:flex-row gap-2 relative">
          <div className="relative flex-1">
            <input
              id="skill-picker-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (query.trim().length > 0) setIsOpen(true);
              }}
              placeholder="Type to search skills (e.g., React, Python, Docker)..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              autoComplete="off"
            />

            {/* Dropdown Suggestions */}
            {isOpen && (
              <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {isLoading ? (
                  <div className="px-3 py-2 text-xs text-slate-500">Searching skills...</div>
                ) : suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">
                    No matching skills found in catalog.
                  </div>
                ) : (
                  suggestions.map((skill) => {
                    const alreadySelected = isSelected(skill.id);
                    const isExcluded = excludedSkillIds.includes(skill.id);
                    const isDisabled = alreadySelected || isExcluded;

                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => !isDisabled && handleAddSkill(skill)}
                        disabled={isDisabled}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                          isDisabled
                            ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                            : 'hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer'
                        }`}
                      >
                        <span className="font-medium">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          {skill.category && (
                            <span className="text-2xs text-slate-400">{skill.category.name}</span>
                          )}
                          {alreadySelected && (
                            <span className="text-2xs text-slate-400">Added</span>
                          )}
                          {isExcluded && (
                            <span className="text-2xs text-amber-600">Unavailable</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Level Selector (when withLevel is enabled) */}
          {withLevel && (
            <div className="flex items-center gap-2">
              <select
                aria-label="Proficiency level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {SKILL_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-100 p-2.5 text-xs text-slate-600">
          Maximum limit of {maxItems} skills reached.
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Selected skill chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        {value.map((item, idx) => {
          const skillObj = item.skill || item;
          const skillName = skillObj?.name || (typeof skillObj === 'string' ? skillObj : 'Skill');
          const skillLevel = item.level;

          return (
            <div
              key={skillObj?.id || skillName || idx}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs"
            >
              <span className="font-medium text-slate-900">{skillName}</span>

              {withLevel && skillLevel && (
                <select
                  aria-label={`Change proficiency for ${skillName}`}
                  value={skillLevel}
                  onChange={(e) => handleLevelChange(idx, e.target.value)}
                  className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-2xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  {SKILL_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => handleRemoveSkill(idx)}
                className="text-slate-400 hover:text-red-600 focus:outline-hidden"
                aria-label={`Remove ${skillName}`}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
