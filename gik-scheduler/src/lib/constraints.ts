// lib/constraints.ts

import { Assignment, Course, Room, Section, TimeSlot, Teacher } from './types';

// Hard Constraints
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

// Soft Constraints Scoring
export function evaluateSoftConstraints(
  schedule: Assignment[],
  courses: Course[],
  rooms: Room[],
  teachers: Teacher[],
  sections: Section[],
  timeSlots: TimeSlot[]
): number {
  let score = 0;

  // Track daily assignments for sections and teachers
  const sectionDailyCounts: Record<string, Record<string, Set<string>>> = {};
  const teacherDailyCounts: Record<string, Record<string, number>> = {};
  
  for (const a of schedule) {
    const ts = timeSlots.find(t => t.id === a.timeSlotId);
    if (!ts) continue;
    
    // Teacher daily setup
    if (!teacherDailyCounts[a.teacherId]) teacherDailyCounts[a.teacherId] = {};
    if (!teacherDailyCounts[a.teacherId][ts.day]) teacherDailyCounts[a.teacherId][ts.day] = 0;
    teacherDailyCounts[a.teacherId][ts.day]++;

    // Section daily setup for consecutive gaps
    if (!sectionDailyCounts[a.sectionId]) sectionDailyCounts[a.sectionId] = {};
    if (!sectionDailyCounts[a.sectionId][ts.day]) sectionDailyCounts[a.sectionId][ts.day] = new Set();
    sectionDailyCounts[a.sectionId][ts.day].add(a.timeSlotId);
    
    // Evaluate Room Capacity vs Course Capacity
    const room = rooms.find(r => r.id === a.roomId);
    const course = courses.find(c => c.id === a.courseId);
    if (room && course) {
      if (room.capacity >= course.capacity) {
         score += 5; // Reward good capacity match
         if (room.capacity - course.capacity < 10) {
            score += 10; // Extra reward for tight fit (efficient use of space)
         }
      }
    }
  }

  // Evaluate Teacher Workload Balance
  for (const tId in teacherDailyCounts) {
    for (const day in teacherDailyCounts[tId]) {
      const classes = teacherDailyCounts[tId][day];
      if (classes <= 3) {
        score += 10; // Reward reasonable daily workload
      } else {
        score -= (classes - 3) * 5; // Penalize heavy daily workload
      }
    }
  }

  return score;
}
