'use client'

import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import type { ChannelSyncLogEntry } from '@/types'

const ACTION_LABELS: Record<string, string> = {
  push: 'Publicación',
  pull: 'Reservas',
  sync: 'Sincronización',
  connect: 'Conexión',
  disconnect: 'Desconexión',
  webhook: 'Webhook',
}

interface ActivityTabProps {
  logs: ChannelSyncLogEntry[]
  onRefresh: () => void
}

export function ActivityTab({ logs, onRefresh }: ActivityTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-[var(--text-1)]">Actividad reciente</h2>
        <button onClick={onRefresh} className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)]" title="Actualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {logs.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-3)]">Sin actividad todavía.</p>}

      <div className="space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center gap-3 text-sm py-2 border-b border-[var(--border)] last:border-0">
            {log.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : log.status === 'error' ? (
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[var(--text-1)]">{ACTION_LABELS[log.action] ?? log.action}</span>
              <span className="text-[var(--text-3)] ml-2">
                {log.direction === 'outbound' ? '→' : '←'} {log.error_message ?? 'OK'}
              </span>
            </div>
            <span className="text-xs text-[var(--text-3)] shrink-0">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
