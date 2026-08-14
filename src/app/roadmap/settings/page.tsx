'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore, STORAGE_KEY } from '@/lib/store'
import {
  syncFromGoogleSheet,
  SHEET_URL,
  fetchGoogleAuthStatus,
  disconnectGoogle,
  type SyncResult,
} from '@/lib/sheetSync'
import {
  Download,
  RotateCcw,
  Database,
  Info,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  LogIn,
  LogOut,
} from 'lucide-react'

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const { data, resetToSeed, exportJson } = useStore()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [auth, setAuth] = useState<{
    configured: boolean
    connected: boolean
    email?: string
    needsReauth?: boolean
  }>({ configured: false, connected: false })
  const [authLoading, setAuthLoading] = useState(true)

  const loadAuth = async () => {
    setAuthLoading(true)
    try {
      setAuth(await fetchGoogleAuthStatus())
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    loadAuth()
  }, [])

  useEffect(() => {
    if (searchParams.get('google_connected') === '1') {
      loadAuth()
    }
    const err = searchParams.get('google_error')
    if (err) {
      setSyncResult({
        ok: false,
        sectors: 0,
        error: `Google sign-in failed: ${err}`,
        syncedAt: new Date().toISOString(),
      })
    }
  }, [searchParams])

  const handleReset = () => {
    if (!confirm("Reset all data to seed? This will clear any edits you've made.")) return
    resetToSeed()
    setSyncResult(null)
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const { data: next, result } = await syncFromGoogleSheet(data)
      if (result.ok) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        window.location.reload()
      }
      setSyncResult(result)
    } catch (e) {
      setSyncResult({
        ok: false,
        sectors: 0,
        error: String(e),
        syncedAt: new Date().toISOString(),
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    await disconnectGoogle()
    await loadAuth()
  }

  const connectionBadge = authLoading
    ? 'Checking…'
    : !auth.configured
      ? 'Not configured'
      : auth.needsReauth
        ? 'Reconnect required (write access)'
      : auth.connected
        ? `✓ ${auth.email ?? 'Connected'}`
        : 'Sign in required'

  const released = data.sectors.filter(s => s.status === 'Published').length

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">App configuration, data sync, and management.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl border border-indigo-200 p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="size-4 text-indigo-500" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Google Sheet Sync</div>
            <span
              className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                auth.connected && !auth.needsReauth
                  ? 'text-green-600 bg-green-50 border-green-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}
            >
              {connectionBadge}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Fetches live data from Google Sheets via OAuth and the Sheets API.
            Sector statuses, publish dates, and asset links are updated. Priorities and local edits are preserved.
          </p>

          {auth.needsReauth && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-900">
              Your Google session has read-only access. Reconnect to enable editing sheets from the app.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {!auth.connected || auth.needsReauth ? (
              <a
                href="/api/auth/google?returnTo=/roadmap/settings"
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                <LogIn className="size-4" />
                {auth.needsReauth ? 'Reconnect Google Account' : 'Connect Google Account'}
              </a>
            ) : (
              <>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-wait font-medium transition-colors"
                >
                  <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing…' : 'Sync from Google Sheet'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  <LogOut className="size-4" />
                  Disconnect
                </button>
              </>
            )}
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
            >
              Open sheet <ExternalLink className="size-3" />
            </a>
          </div>

          {!auth.configured && !authLoading && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-900">
              Server OAuth is not configured. Add <code className="text-xs">GOOGLE_CLIENT_ID</code>,{' '}
              <code className="text-xs">GOOGLE_CLIENT_SECRET</code>, and <code className="text-xs">AUTH_SECRET</code> to{' '}
              <code className="text-xs">.env.local</code>.
            </div>
          )}

          {syncResult && (
            <div className={`flex items-start gap-3 p-3 rounded-lg text-sm ${syncResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {syncResult.ok
                ? <CheckCircle className="size-4 text-green-600 mt-0.5 shrink-0" />
                : <AlertCircle className="size-4 text-red-600 mt-0.5 shrink-0" />
              }
              <div>
                {syncResult.ok
                  ? <><strong className="text-green-800">Synced successfully</strong> — {syncResult.sectors} sectors updated. Page will reload.</>
                  : <>
                      <strong className="text-red-800">Sync failed:</strong> {syncResult.error}
                      {syncResult.needsAuth && syncResult.loginUrl && (
                        <div className="mt-2">
                          <a href={syncResult.loginUrl} className="text-indigo-600 hover:underline text-xs font-medium">
                            Connect Google account →
                          </a>
                        </div>
                      )}
                    </>
                }
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(syncResult.syncedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-400 font-mono bg-gray-50 rounded p-2 truncate">
            GET /api/sheets/roadmap
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Database className="size-4 text-indigo-500" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Local Data</div>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Edits save to this browser instantly and, when <code className="text-[10px]">GITHUB_TOKEN</code> is configured,
            are committed to the repo so everyone sees them (see the save indicator in the sidebar).
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportJson} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="size-3.5" /> Export JSON
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
              <RotateCcw className="size-3.5" /> Reset to Seed
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            {[['Sectors', data.sectors.length], ['Reports Released', released]].map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-lg py-2">
                <div className="text-xl font-bold text-indigo-600">{v}</div>
                <div className="text-[10px] text-gray-400">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="size-4 text-indigo-500" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">App Info</div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ['Purpose',         'Market research publishing pipeline'],
              ['Storage',         'localStorage'],
              ['Live Sheet Sync', auth.connected ? '✓ OAuth + Sheets API' : 'OAuth required'],
              ['Framework',       'Next.js 16 + Tailwind v4'],
              ['Deployment',      'Vercel'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-xs text-gray-400 w-36 shrink-0">{k}</span>
                <span className="font-medium text-gray-800 text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading settings…</div>}>
      <SettingsPageContent />
    </Suspense>
  )
}
