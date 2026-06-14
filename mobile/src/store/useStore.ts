import { create } from 'zustand';
import { SefariaTextResponse, getTalmudText } from '../lib/sefaria';

interface AppState {
  currentRef: string;
  activeSegmentIndex: number;
  data: SefariaTextResponse | null;
  isLoading: boolean;
  error: string | null;
  aiTranslations: Record<string, string>;
  translatingRefs: Record<string, boolean>;
  
  setCurrentRef: (ref: string) => void;
  setActiveSegmentIndex: (index: number) => void;
  loadPage: (ref: string) => Promise<void>;
  handleAiTranslate: (ref: string, text: string, context: string) => Promise<void>;
  clearError: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentRef: 'Berakhot 2a',
  activeSegmentIndex: 0,
  data: null,
  isLoading: false,
  error: null,
  aiTranslations: {},
  translatingRefs: {},

  setCurrentRef: (ref) => set({ currentRef: ref }),
  setActiveSegmentIndex: (index) => set({ activeSegmentIndex: index }),
  
  clearError: () => set({ error: null }),
  
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

  handleAiTranslate: async (ref, text, context) => {
    if (get().aiTranslations[ref]) return;
    
    set(state => ({ 
      translatingRefs: { ...state.translatingRefs, [ref]: true } 
    }));

    try {
      // Use the production URL for the live site, fallback to localhost for development
      const API_BASE = 'https://sugy-ai-65095948.a.run.app'; // Your Cloud Run URL
      const response = await fetch(`${API_BASE}/api/ai-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate', text, context })
      });
      
      const resData = await response.json();
      
      if (resData.error) {
        console.error('AI Translation API error:', resData.error);
        // Using alert from react-native (need to ensure it's imported or available)
        // For simplicity in store, we'll just throw and catch
        throw new Error(resData.error);
      }

      if (resData.result) {
        set(state => ({
          aiTranslations: { ...state.aiTranslations, [ref]: resData.result }
        }));
      } else {
        throw new Error('No result received from AI');
      }
    } catch (err: any) {
      console.error('AI Translation failed:', err);
      // In mobile, we might want to set a global error state
      set({ error: `Translation failed: ${err.message}` });
    } finally {
      set(state => ({
        translatingRefs: { ...state.translatingRefs, [ref]: false }
      }));
    }
  },
}));
