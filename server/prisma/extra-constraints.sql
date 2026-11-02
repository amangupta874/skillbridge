-- Append this block to the generated init migration (prisma migrate dev --create-only), BEFORE applying it.
-- Verified against PostgreSQL 16: each rule rejects bad data; the partial index still allows a new
-- exchange after the previous one was REJECTED, CANCELLED or COMPLETED.

ALTER TABLE projects
  ADD CONSTRAINT chk_team_size CHECK (max_team_size BETWEEN 2 AND 10);

ALTER TABLE skill_exchanges
  ADD CONSTRAINT chk_not_self CHECK (sender_id <> recipient_id);

CREATE UNIQUE INDEX uq_active_exchange
  ON skill_exchanges (sender_id, recipient_id, offered_skill_id, requested_skill_id)
  WHERE status IN ('PENDING', 'ACCEPTED');

ALTER TABLE notifications
  ADD CONSTRAINT chk_one_target CHECK (num_nonnulls(application_id, exchange_id) = 1);

CREATE VIEW skill_demand_supply AS
SELECT s.id, s.name,
  (SELECT COUNT(*) FROM project_skills ps JOIN projects p ON p.id = ps.project_id
    WHERE ps.skill_id = s.id AND p.status = 'OPEN')                    AS open_projects_needing_it,
  (SELECT COUNT(*) FROM user_skills us WHERE us.skill_id = s.id)       AS students_who_know_it,
  (SELECT COUNT(*) FROM user_learning_goals g WHERE g.skill_id = s.id) AS students_who_want_it
FROM skills s;
