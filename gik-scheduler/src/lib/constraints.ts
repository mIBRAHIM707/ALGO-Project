// lib/constraints.ts
//
// This module contains ALL constraint logic for the timetable CSP.
// Constraints are split into two categories:
//
// 1. HARD CONSTRAINTS (canAssign) — Must be satisfied for a valid timetable.
//    If any hard constraint is violated, the assignment is rejected.
//
// 2. SOFT CONSTRAINTS (evaluateSoftConstraints) — Optimization goals.
//    These produce a numeric score; higher = better quality timetable.
//    They do NOT block assignments, they only rank solutions.

import { Assignment, Course, Room, Section, TimeSlot, Teacher } from './types';

// ═══════════════════════════════════════════════════════════════════
// HARD CONSTRAINTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Checks whether a proposed assignment violates any hard constraint
 * against the current partial schedule.
 *
 * Hard constraints enforced:
 * 1. **Teacher conflict**: A teacher cannot teach two classes at the same time.
 * 2. **Room conflict**: A room cannot host two classes at the same time.
 * 3. **Section conflict**: A student section cannot attend two classes at the same time.
 * 4. **Same-day repeat**: A section cannot have the same course twice on the same day.
 *
 * @param assignment   - The proposed new assignment to validate
 * @param currentSchedule - All assignments committed so far
 * @param courses      - Full list of courses (unused here but kept for interface consistency)
 * @param rooms        - Full list of rooms (unused here but kept for interface consistency)
 * @param teachers     - Full list of teachers (unused here but kept for interface consistency)
 * @param sections     - Full list of sections (unused here but kept for interface consistency)
 * @param timeSlots    - Full list of time slots (used to resolve day from timeSlotId)
 * @returns true if the assignment is valid (no hard constraint violated), false otherwise
 */
export function canAssign(
  assignment: Assignment,
  currentSchedule: Assignment[],
  courses: Course[],
  rooms: Room[],
  teachers: Teacher[],
  sections: Section[],
  timeSlots: TimeSlot[]
): boolean {
  // 1. A teacher cannot teach two classes at the same time
  const teacherConflict = currentSchedule.some(
    a => a.teacherId === assignment.teacherId && a.timeSlotId === assignment.timeSlotId
  );
  if (teacherConflict) return false;

  // 2. A room cannot host two classes at the same time
  const roomConflict = currentSchedule.some(
    a => a.roomId === assignment.roomId && a.timeSlotId === assignment.timeSlotId
  );
  if (roomConflict) return false;

  // 3. A section cannot have overlapping classes
  const sectionConflict = currentSchedule.some(
    a => a.sectionId === assignment.sectionId && a.timeSlotId === assignment.timeSlotId
  );
  if (sectionConflict) return false;

  // 4. A section cannot have the exact same course multiple times on the same day
  const targetTimeSlot = timeSlots.find(t => t.id === assignment.timeSlotId);
  const sameCourseSameDay = currentSchedule.some(a => {
    if (a.sectionId !== assignment.sectionId || a.courseId !== assignment.courseId) return false;
    const ts = timeSlots.find(t => t.id === a.timeSlotId);
    return ts?.day === targetTimeSlot?.day;
  });
  if (sameCourseSameDay) return false;

  return true;
}

// ═══════════════════════════════════════════════════════════════════
// SOFT CONSTRAINTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Evaluates soft constraint quality of a completed (or partial) schedule.
 * Returns a numeric score — higher is better.
 *
 * Soft constraints evaluated:
 * 1. **Room capacity efficiency**: Rewards assigning rooms that fit the class
 *    tightly (capacity >= enrollment, bonus for <10 seat surplus).
 * 2. **Teacher workload balance**: Rewards teachers with ≤3 classes/day,
 *    penalizes each additional class beyond 3.
 * 3. **Day balance**: Penalizes days that have >20% more sessions than average
 *    (encourages even distribution across the week).
 *
 * @param schedule  - The full list of assignments to evaluate
 * @param courses   - All courses (used for capacity lookup)
 * @param rooms     - All rooms (used for capacity lookup)
 * @param teachers  - All teachers (unused but kept for interface consistency)
 * @param sections  - All sections (unused but kept for interface consistency)
 * @param timeSlots - All time slots (used for day resolution)
 * @returns A numeric score representing schedule quality (higher = better)
 */
export function evaluateSoftConstraints(
  schedule: Assignment[],
  courses: Course[],
  rooms: Room[],
  teachers: Teacher[],
  sections: Section[],
  timeSlots: TimeSlot[]
): number {
  let score = 0;

  // Accumulators for per-day and per-teacher tracking
  const teacherDailyCounts: Record<string, Record<string, number>> = {};
  const daySessionCounts: Record<string, number> = {};
  
  for (const a of schedule) {
    const ts = timeSlots.find(t => t.id === a.timeSlotId);
    if (!ts) continue;

    // Track total sessions per day (for day balance scoring)
    daySessionCounts[ts.day] = (daySessionCounts[ts.day] || 0) + 1;
    
    // Track teacher daily load
    if (!teacherDailyCounts[a.teacherId]) teacherDailyCounts[a.teacherId] = {};
    if (!teacherDailyCounts[a.teacherId][ts.day]) teacherDailyCounts[a.teacherId][ts.day] = 0;
    teacherDailyCounts[a.teacherId][ts.day]++;

    // --- Soft Constraint 1: Room Capacity Efficiency ---
    const room = rooms.find(r => r.id === a.roomId);
    const course = courses.find(c => c.id === a.courseId);
    if (room && course) {
      if (room.capacity >= course.capacity) {
         score += 5; // Reward: room fits the class
         if (room.capacity - course.capacity < 10) {
            score += 10; // Bonus: tight fit = efficient use of space
         }
      }
    }
  }

  // --- Soft Constraint 2: Teacher Workload Balance ---
  for (const tId in teacherDailyCounts) {
    for (const day in teacherDailyCounts[tId]) {
      const classes = teacherDailyCounts[tId][day];
      if (classes <= 3) {
        score += 10; // Reward: reasonable daily workload
      } else {
        score -= (classes - 3) * 5; // Penalty: each extra class beyond 3
      }
    }
  }

  // --- Soft Constraint 3: Day Balance ---
  const activeDays = Object.keys(daySessionCounts);
  if (activeDays.length > 0) {
    const totalSessions = Object.values(daySessionCounts).reduce((sum, count) => sum + count, 0);
    const avgSessionsPerDay = totalSessions / activeDays.length;
    const threshold = avgSessionsPerDay * 1.2; // 20% above average

    for (const day of activeDays) {
      if (daySessionCounts[day] > threshold) {
        const excess = daySessionCounts[day] - threshold;
        score -= (excess * 3); // Penalty: proportional to overflow
      }
    }
  }

  return score;
}
