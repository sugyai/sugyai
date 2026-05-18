import { create } from 'zustand';
import { SefariaTextResponse, getTalmudText } from '../lib/sefaria';

interface AppState {
  currentRef: string;
  activeSegmentIndex: number;
  data: SefariaTextResponse | null;
  isLoading: boolean;
  error: string | null;
  
  setCurrentRef: (ref: string) => void;
  setActiveSegmentIndex: (index: number) => void;
  loadPage: (ref: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentRef: 'Berakhot 2a',
  activeSegmentIndex: 0,
  data: null,
  isLoading: false,
  error: null,

  setCurrentRef: (ref) => set({ currentRef: ref }),
  setActiveSegmentIndex: (index) => set({ activeSegmentIndex: index }),
  
  loadPage: async (ref) => {
    set({ isLoading: true, error: null, currentRef: ref });
    try {
      const data = await getTalmudText(ref);
      set({ data, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to load page', isLoading: false });
      console.error(err);
    }
  },
}));
