// lib/types.ts

export interface Course {
  id: string;
  title: string;
  program: string;
  creditHours: number;
  type: string;
  capacity: number;
  instructor: string;
}

export interface Teacher {
  id: string;
  name: string;
  department: string;
  courseIds: string[];
}

export interface Room {
  id: string;
  name: string;
  building: string;
  type: string;
  capacity: number;
}

export interface Section {
  id: string;
  program: string;
  courseIds: string[];
}

export interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  slotIndex: number;
  dayType: string;
}

export interface FullData {
  courses: Course[];
  teachers: Teacher[];
  rooms: Room[];
  sections: Section[];
  timeSlots: TimeSlot[];
}

export interface Assignment {
  courseId: string;
  teacherId: string;
  roomId: string;
  timeSlotId: string;
  sectionId: string;
  isLab: boolean;
}

export interface GenerationStats {
  hardConstraintsMet: boolean;
  softScore: number;
  timeMs: number;
  backtracks: number;
  totalAssigned: number;
  totalCourses: number;
}

export interface GenerateResponse {
  schedule: Assignment[];
  stats: GenerationStats;
}
