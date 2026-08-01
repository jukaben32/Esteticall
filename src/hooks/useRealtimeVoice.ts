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
        if (!res.ok) throw new Error(`Failed to start session (${res.status})`)
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

        dc.addEventListener('message', async (event) => {
          const msg = JSON.parse(event.data)

          if (msg.type === 'response.audio_transcript.done') {
            appendTranscript({ role: 'agent', text: msg.transcript, final: true })
          }
          if (msg.type === 'conversation.item.input_audio_transcription.completed') {
            appendTranscript({ role: 'caller', text: msg.transcript, final: true })
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
    reset()
  }, [setStatus, reset])

  return { startCall, endCall }
}
