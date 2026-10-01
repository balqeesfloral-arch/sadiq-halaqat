# Quantity-only side lessons

Side lessons are entered in recitations using whole faces, extra lines, and a single evaluation. Quran uses 15 lines per face; Noorania uses 10. Extra lines are normalized when saved. The quantity is independent of monthly plans, lesson activity and generated Quran ranges. A side-only recitation is valid.

`recitations` and `noorania_recitations` have nullable `side_lesson_faces` and `side_lesson_lines`. Both NULL means a historical record whose measurements are preserved. Both populated means the new quantity format. Database checks enforce nonnegative quantities, normalized lines and an evaluation for a positive amount. Zero quantity requires an empty evaluation.

A private trigger synchronizes one quantity-only Quran `recitation_segments` row in the same transaction as its parent. The teacher's lesson/revision synchronization excludes side segments. Editing an unrelated field on an old record leaves its side ranges and both ratings intact; explicitly editing its side amount converts it to the single new quantity format. Parent deletion cascades to its segment.

The `recitation_side_lesson_totals` view uses `security_invoker=true`, with existing underlying row-level security. It returns raw and accepted quantities for both programs. New quantities take precedence over historical segments, which take precedence over legacy ranges/text. This prevents double counting. Repeat/skipped segments and repeat evaluations contribute zero accepted faces. The read helper scopes totals to halaqa, students and date period, batches IDs, and paginates every result; exceeding the API's row limit cannot silently truncate monthly achievement.

Teacher, supervisor/admin and student monthly achievement pages use this view directly. Side amounts therefore remain visible without a plan, follow their recitation month, and update after edits or deletion. Exports and reports show faces and lines. Unrepresentable historical fractional faces remain exact instead of being rounded to a different line quantity.

Retired side policies and generation RPCs are removed from active UI flows; authenticated/anonymous generator execution is revoked. Outstanding side assignments become superseded. Performed recitations, completed assignments, historical policies and lesson/revision behavior are retained. Saving a learning policy keeps the side mode disabled. Historical migration files remain unchanged.

Validation:

- `npm run test:side-lessons`: actual save functions and rendered quantity/evaluation fields, no-plan student achievement, pagination, error handling and Excel column alignment.
- `scripts/verify-simple-side-lessons.sql`: 19 transactional database checks, including paused lessons, dates, repeats, legacy quantities/ranges, edits/deletes, validation and student isolation.
- `scripts/verify-adaptive-learning.sql`: 12 retained enrollment/resume/holiday/history/authorization cases. Tests for the retired generator were replaced by the new side quantity suite.
- `scripts/verify-security-boundaries.sql`: 17 application security boundary cases.

Database fixtures are rolled back. Application tests use mocks and do not contact live accounts or send notifications.

Applied migration: `supabase/migrations/20261001065221_simple_side_lesson_amounts.sql`. All 48 database checks passed against the applied production schema with fixture changes rolled back; all 20 application checks, lint, build, CSP verification and artifact scans passed locally.
