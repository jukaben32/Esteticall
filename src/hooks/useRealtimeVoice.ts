'use client'

import { useCallback, useRef } from 'react'
import { useVoiceStore } from '@/store/voice'
import type { RealtimeSessionResponse } from '@/types'

// OpenAI retired the beta SDP-exchange shape at /v1/realtime (still returns
// 400 beta_api_shape_disabled) — the GA WebRTC endpoint is /v1/realtime/calls.
const REALTIME_URL = 'https://api.openai.com/v1/realtime/calls'

interface StartCallOptions {
  agentId: string
  listingId?: string
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>
}

// Browser-side WebRTC client for the OpenAI Realtime API. Mints a
// short-lived session server-side (POST /api/agents/[agentId]/session,
// which holds OPENAI_API_KEY), then talks to OpenAI directly with only the
// ephemeral client_secret — the real API key never reaches the browser.
export function useRealtimeVoice() {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // item_ids already saved via the per-turn response.output_audio_transcript.done
  // event, so the response.done fallback below never double-saves a turn.
  const savedAgentItemIdsRef = useRef<Set<string>>(new Set())

  const { setStatus, setConversationId, appendTranscript, setError, reset } = useVoiceStore()

  const startCall = useCallback(
    async ({ agentId, listingId, onToolCall }: StartCallOptions) => {
      try {
        setStatus('connecting')

        const res = await fetch(`/api/agents/${agentId}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        })
        if (!res.ok) {
          // The session route sends a real message for known cases (e.g.
          // "no_voice_minutes") — surface that instead of a bare status code
          // so the widget can point the caller to WhatsApp instead of just
          // showing a generic failure.
          const body = await res.json().catch(() => null)
          throw new Error(body?.message || `Failed to start session (${res.status})`)
        }
        const session: RealtimeSessionResponse = await res.json()
        setConversationId(session.conversationId)

        const pc = new RTCPeerConnection()
        pcRef.current = pc

        const audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioRef.current = audioEl
        pc.ontrack = (event) => {
          audioEl.srcObject = event.streams[0]
        }

        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = micStream
        micStream.getTracks().forEach((track) => pc.addTrack(track, micStream))

        const dc = pc.createDataChannel('oai-events')
        dcRef.current = dc

        // With server_vad turn detection the model only ever responds after
        // detecting the caller's turn — it never speaks first on its own, so
        // the "Open the call with: ..." greeting instruction in the system
        // prompt was never actually triggered and the caller sat in silence
        // until they spoke. Kicking off a response as soon as the channel is
        // ready makes the agent greet them immediately instead.
        dc.addEventListener('open', () => {
          dc.send(JSON.stringify({ type: 'response.create' }))
        })

        dc.addEventListener('message', async (event) => {
          const msg = JSON.parse(event.data)

          // Renamed in the GA Realtime API (the beta name 'response.audio_transcript.done'
          // no longer fires) — see /v1/realtime/client_secrets migration notes.
          if (msg.type === 'response.output_audio_transcript.done' && msg.transcript) {
            savedAgentItemIdsRef.current.add(msg.item_id)
            appendTranscript({ role: 'agent', text: msg.transcript, final: true })
            void fetch(`/api/conversations/${session.conversationId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'agent', content: msg.transcript }),
            })
          }

          // Fallback: the per-turn event above is documented to fire even on an
          // interrupted/cancelled response, but if a turn's transcript is ever
          // missed there, response.done still carries the full output — so pull
          // any agent transcript from it that wasn't already saved above.
          if (msg.type === 'response.done') {
            const outputs = msg.response?.output ?? []
            for (const item of outputs) {
              if (savedAgentItemIdsRef.current.has(item.id)) continue
              const transcript = (item.content ?? [])
                .map((part: { transcript?: string }) => part.transcript)
                .filter(Boolean)
                .join(' ')
              if (!transcript) continue
              savedAgentItemIdsRef.current.add(item.id)
              appendTranscript({ role: 'agent', text: transcript, final: true })
              void fetch(`/api/conversations/${session.conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'agent', content: transcript }),
              })
            }
          }

          if (msg.type === 'conversation.item.input_audio_transcription.completed') {
            appendTranscript({ role: 'caller', text: msg.transcript, final: true })
            void fetch(`/api/conversations/${session.conversationId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'caller', content: msg.transcript }),
            })
          }

          if (msg.type === 'response.function_call_arguments.done') {
            const args = JSON.parse(msg.arguments || '{}')
            const result = await onToolCall(msg.name, args)

            dc.send(
              JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: msg.call_id,
                  output: JSON.stringify(result),
                },
              })
            )
            dc.send(JSON.stringify({ type: 'response.create' }))
          }
        })

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        const sdpResponse = await fetch(`${REALTIME_URL}?model=${session.model}`, {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${session.clientSecret}`,
            'Content-Type': 'application/sdp',
          },
        })
        if (!sdpResponse.ok) throw new Error('Realtime SDP negotiation failed')

        const answer = { type: 'answer' as const, sdp: await sdpResponse.text() }
        await pc.setRemoteDescription(answer)

        setStatus('active')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start voice call')
      }
    },
    [setStatus, setConversationId, appendTranscript, setError]
  )

  const endCall = useCallback(() => {
    setStatus('ending')
    dcRef.current?.close()
    pcRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioRef.current?.remove()
    pcRef.current = null
    dcRef.current = null

    const { conversationId } = useVoiceStore.getState()
    if (conversationId) {
      void fetch(`/api/conversations/${conversationId}/end`, { method: 'POST' })
    }

    reset()
  }, [setStatus, reset])

  return { startCall, endCall }
}
