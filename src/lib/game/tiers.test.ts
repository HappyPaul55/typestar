import { describe, expect, test } from "bun:test";
import { GRADE_MULTIPLIER, gradeOf, holdGradeOf } from "./tiers";

describe("gradeOf", () => {
  test("grades lateness into perfect / great / good / miss", () => {
    expect(gradeOf(0).grade).toBe("perfect");
    expect(gradeOf(0.1).grade).toBe("perfect");
    expect(gradeOf(0.11).grade).toBe("great");
    expect(gradeOf(0.25).grade).toBe("great");
    expect(gradeOf(0.26).grade).toBe("good");
    expect(gradeOf(0.45).grade).toBe("good");
    expect(gradeOf(0.46).grade).toBe("miss");
  });

  test("never penalises an early hit", () => {
    expect(gradeOf(-5).grade).toBe("perfect");
    expect(gradeOf(-5).multiplier).toBe(GRADE_MULTIPLIER.perfect);
  });

  test("multipliers descend with lateness", () => {
    expect(gradeOf(0).multiplier).toBeGreaterThan(gradeOf(0.2).multiplier);
    expect(gradeOf(0.2).multiplier).toBeGreaterThan(gradeOf(0.4).multiplier);
    expect(gradeOf(0.4).multiplier).toBeGreaterThan(gradeOf(1).multiplier);
  });
});

describe("holdGradeOf", () => {
  test("grades a held fraction", () => {
    expect(holdGradeOf(1).grade).toBe("perfect");
    expect(holdGradeOf(0.9).grade).toBe("perfect");
    expect(holdGradeOf(0.65).grade).toBe("great");
    expect(holdGradeOf(0.4).grade).toBe("good");
    expect(holdGradeOf(0.39).grade).toBe("miss");
  });

  test("a miss has no multiplier", () => {
    expect(holdGradeOf(0).multiplier).toBe(GRADE_MULTIPLIER.miss);
  });
});
