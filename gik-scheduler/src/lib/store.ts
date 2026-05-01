// lib/store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FullData, Assignment, GenerationStats } from './types';
import defaultData from './gik-data-spring2026.json';

interface AppState {
  data: FullData;
  schedule: Assignment[];
  stats: GenerationStats | null;
  setData: (data: FullData) => void;
  setSchedule: (schedule: Assignment[], stats: GenerationStats) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      data: defaultData as FullData,
      schedule: [],
      stats: null,
      setData: (data) => set({ data }),
      setSchedule: (schedule, stats) => set({ schedule, stats }),
    }),
    {
      name: 'gik-scheduler-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        data: state.data,
        schedule: state.schedule,
        stats: state.stats,
      }),
    }
  )
);
