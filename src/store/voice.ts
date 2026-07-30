import { create } from 'zustand'

export type VoiceCallStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'error'

interface TranscriptEntry {
  role: 'agent' | 'caller'
  text: string
  final: boolean
}

interface VoiceState {
  status: VoiceCallStatus
  conversationId: string | null
  transcript: TranscriptEntry[]
  error: string | null
  setStatus: (status: VoiceCallStatus) => void
  setConversationId: (id: string | null) => void
  appendTranscript: (entry: TranscriptEntry) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  status: 'idle',
  conversationId: null,
  transcript: [],
  error: null,
  setStatus: (status) => set({ status }),
  setConversationId: (conversationId) => set({ conversationId }),
  appendTranscript: (entry) => set((s) => ({ transcript: [...s.transcript, entry] })),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  reset: () => set({ status: 'idle', conversationId: null, transcript: [], error: null }),
}))
