/**
 * The hit-quality ladder, shared by typing and singing.
 *
 * Typing grades a keystroke by how **late** it is (early is free); singing
 * grades a note by how much of its span was **held in tune**. Both feed the same
 * multipliers, so a "perfect" means the same thing in either style — and the UI
 * can show hit quality consistently.
 */

export type Grade = "perfect" | "great" | "good" | "miss";

/** How late a keystroke may be, in seconds, and still earn each grade. */
const PERFECT_WINDOW = 0.1;
const GREAT_WINDOW = 0.25;
const GOOD_WINDOW = 0.45;

/** The fraction of a sung note that must be held in tune for each grade. */
const HOLD_PERFECT = 0.9;
const HOLD_GREAT = 0.65;
export const HOLD_GOOD = 0.4;

/** The score multiplier each grade earns. */
export const GRADE_MULTIPLIER: Record<Grade, number> = {
  perfect: 1,
  great: 0.7,
  good: 0.4,
  miss: 0,
};

export interface GradeResult {
  grade: Grade;
  multiplier: number;
}

function result(grade: Grade): GradeResult {
  return { grade, multiplier: GRADE_MULTIPLIER[grade] };
}

/** Grade a keystroke by how late it was (a negative delta is not penalised). */
export function gradeOf(lateBy: number): GradeResult {
  const late = Math.max(0, lateBy);
  if (late <= PERFECT_WINDOW) return result("perfect");
  if (late <= GREAT_WINDOW) return result("great");
  if (late <= GOOD_WINDOW) return result("good");
  return result("miss");
}

/** Grade a sung note by the fraction of its span held in tune. */
export function holdGradeOf(fraction: number): GradeResult {
  if (fraction >= HOLD_PERFECT) return result("perfect");
  if (fraction >= HOLD_GREAT) return result("great");
  if (fraction >= HOLD_GOOD) return result("good");
  return result("miss");
}
