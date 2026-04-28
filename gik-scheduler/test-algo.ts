import * as fs from 'fs';
import { CSPEngine } from './src/lib/csp';
import { FullData, Section, Course } from './src/lib/types';

const dataFile = fs.readFileSync('data/gik-data-spring2026.json', 'utf8');
const data: FullData = JSON.parse(dataFile);

// ─────────────────────────────────────────────
// DIAGNOSTIC 1: Data overview
// ─────────────────────────────────────────────
console.log('\n════════════════════════════════════');
console.log('  DIAGNOSTIC REPORT');
console.log('════════════════════════════════════');
console.log(`Courses:    ${data.courses.length}`);
console.log(`Sections:   ${data.sections.length}`);
console.log(`Rooms:      ${data.rooms.length}`);
console.log(`Time Slots: ${data.timeSlots.length}`);
console.log(`Teachers:   ${data.teachers.length}`);

// ─────────────────────────────────────────────
// DIAGNOSTIC 2: Per-section load vs capacity
// The #1 likely cause of failure: too many sessions needed per section vs timeslots available
// ─────────────────────────────────────────────
console.log('\n──────────────────────────────────');
console.log('  SECTION LOAD vs TIMESLOT CAPACITY');
console.log('──────────────────────────────────');
console.log(`Available timeslots per section: ${data.timeSlots.length}`);

let overloadedSections = 0;
for (const section of data.sections) {
  let totalSessions = 0;
  const missingCourses: string[] = [];

  for (const courseId of section.courseIds) {
    const course = data.courses.find(c => c.id === courseId);
    if (!course) {
      missingCourses.push(courseId);
      continue;
    }
    const sessions = Math.min(3, Math.ceil(course.creditHours / 2));
    totalSessions += sessions;
  }

  const slack = data.timeSlots.length - totalSessions;
  const status = slack < 0 ? '❌ IMPOSSIBLE' : slack < 5 ? '⚠️  VERY TIGHT' : '✅ OK';

  console.log(
    `${section.id.padEnd(10)} | courses=${String(section.courseIds.length).padStart(3)} | sessions needed=${String(totalSessions).padStart(3)} | slack=${String(slack).padStart(3)} | ${status}${missingCourses.length > 0 ? ` | missing=${missingCourses.join(',')}` : ''}`
  );

  if (slack < 0) overloadedSections++;
}

if (overloadedSections > 0) {
  console.log(`\n⛔ ${overloadedSections} section(s) need MORE sessions than there are timeslots — these are MATHEMATICALLY IMPOSSIBLE to schedule.`);
}

// ─────────────────────────────────────────────
// DIAGNOSTIC 3: Room feasibility per course
// Courses with no valid room = always fail
// ─────────────────────────────────────────────
console.log('\n──────────────────────────────────');
console.log('  ROOM FEASIBILITY');
console.log('──────────────────────────────────');
let noRoomCount = 0;
for (const course of data.courses) {
  const validRooms = data.rooms.filter(r => r.capacity >= course.capacity);
  if (validRooms.length === 0) {
    console.log(`❌ No valid room for: ${course.id} "${course.title}" (needs capacity ${course.capacity}, max available=${Math.max(...data.rooms.map(r => r.capacity))})`);
    noRoomCount++;
  }
}
if (noRoomCount === 0) console.log('✅ All courses have at least one valid room.');
else console.log(`\n⛔ ${noRoomCount} course(s) have no valid room.`);

// ─────────────────────────────────────────────
// DIAGNOSTIC 4: Teacher conflicts / overload
// ─────────────────────────────────────────────
console.log('\n──────────────────────────────────');
console.log('  TEACHER LOAD');
console.log('──────────────────────────────────');
let tbaCount = 0;
let overloadedTeachers = 0;
for (const teacher of data.teachers) {
  // Count total sessions this teacher needs to cover across ALL sections
  let totalSessions = 0;
  for (const courseId of teacher.courseIds) {
    const course = data.courses.find(c => c.id === courseId);
    if (!course) continue;
    // Count how many sections use this course
    const sectionCount = data.sections.filter(s => s.courseIds.includes(courseId)).length;
    const sessions = Math.min(3, Math.ceil(course.creditHours / 2));
    totalSessions += sessions * sectionCount;
  }

  if (teacher.name === 'TBA') {
    tbaCount = teacher.courseIds.length;
    console.log(`⚠️  TBA teacher covers ${teacher.courseIds.length} courses (${totalSessions} total sessions)`);
  } else if (totalSessions > data.timeSlots.length) {
    console.log(`❌ ${teacher.name.padEnd(30)} needs ${totalSessions} sessions but only ${data.timeSlots.length} timeslots exist`);
    overloadedTeachers++;
  }
}
if (overloadedTeachers === 0) console.log('✅ No teacher is individually overloaded.');

// ─────────────────────────────────────────────
// DIAGNOSTIC 5: Timeslot distribution
// ─────────────────────────────────────────────
console.log('\n──────────────────────────────────');
console.log('  TIMESLOT DISTRIBUTION');
console.log('──────────────────────────────────');
const byDay: Record<string, number> = {};
for (const ts of data.timeSlots) {
  byDay[ts.day] = (byDay[ts.day] ?? 0) + 1;
}
for (const [day, count] of Object.entries(byDay)) {
  console.log(`  ${day.padEnd(12)}: ${count} slots`);
}

// ─────────────────────────────────────────────
// DIAGNOSTIC 6: Total variable count
// ─────────────────────────────────────────────
console.log('\n──────────────────────────────────');
console.log('  VARIABLE COUNT (sessions to schedule)');
console.log('──────────────────────────────────');
let totalVars = 0;
for (const section of data.sections) {
  for (const courseId of section.courseIds) {
    const course = data.courses.find(c => c.id === courseId);
    if (!course) continue;
    totalVars += Math.min(3, Math.ceil(course.creditHours / 2));
  }
}
const totalSlotCapacity = data.timeSlots.length * data.sections.length;
console.log(`Total sessions to schedule: ${totalVars}`);
console.log(`Total (timeslot × section) capacity: ${totalSlotCapacity}`);
console.log(`Global fill rate: ${((totalVars / totalSlotCapacity) * 100).toFixed(1)}%`);
if (totalVars > totalSlotCapacity) {
  console.log('⛔ GLOBALLY INFEASIBLE: more sessions than available slots across all sections.');
} else {
  console.log('✅ Globally feasible in theory (ignoring teacher/room conflicts).');
}

// ─────────────────────────────────────────────
// RUN THE ALGORITHM
// ─────────────────────────────────────────────
console.log('\n════════════════════════════════════');
console.log('  RUNNING CSP ENGINE');
console.log('════════════════════════════════════');
const engine = new CSPEngine(data);
(engine as any).timeoutMs = 10000;

const result = engine.run();

console.log(`\nAssigned:           ${result.stats.totalAssigned} / ${result.stats.totalCourses}`);
console.log(`Hard constraints:   ${result.stats.hardConstraintsMet ? '✅ MET' : '❌ NOT MET'}`);
console.log(`Soft score:         ${result.stats.softScore}`);
console.log(`Time:               ${result.stats.timeMs}ms`);
console.log(`Backtracks:         ${result.stats.backtracks}`);

// ─────────────────────────────────────────────
// POST-RUN: What was NOT scheduled?
// ─────────────────────────────────────────────
if (result.stats.totalAssigned < result.stats.totalCourses) {
  console.log('\n──────────────────────────────────');
  console.log('  UNSCHEDULED SESSIONS');
  console.log('──────────────────────────────────');

  const assignedKeys = new Set(
    result.schedule.map(a => `${a.sectionId}_${a.courseId}`)
  );

  const unscheduled: { section: string; courseId: string; title: string }[] = [];
  for (const section of data.sections) {
    for (const courseId of section.courseIds) {
      const key = `${section.id}_${courseId}`;
      if (!assignedKeys.has(key)) {
        const course = data.courses.find(c => c.id === courseId);
        unscheduled.push({ section: section.id, courseId, title: course?.title ?? '???' });
      }
    }
  }

  // Group by section
  const bySec: Record<string, typeof unscheduled> = {};
  for (const u of unscheduled) {
    if (!bySec[u.section]) bySec[u.section] = [];
    bySec[u.section].push(u);
  }

  for (const [sec, items] of Object.entries(bySec)) {
    console.log(`\n  ${sec} (${items.length} unscheduled):`);
    for (const item of items) {
      console.log(`    - ${item.courseId}: ${item.title}`);
    }
  }
}

console.log('\n════════════════════════════════════\n');
