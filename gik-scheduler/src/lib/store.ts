// lib/store.ts
import { create } from 'zustand';
import { FullData, Assignment, GenerationStats } from './types';
import defaultData from './gik-data-with-sections.json';

interface AppState {
  data: FullData;
  schedule: Assignment[];
  stats: GenerationStats | null;
  setData: (data: FullData) => void;
  setSchedule: (schedule: Assignment[], stats: GenerationStats) => void;
}

export const useStore = create<AppState>((set) => ({
  data: defaultData as FullData,
  schedule: [],
  stats: null,
  setData: (data) => set({ data }),
  setSchedule: (schedule, stats) => set({ schedule, stats }),
}));
