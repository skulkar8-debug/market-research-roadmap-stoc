import { NextRequest, NextResponse } from 'next/server'

/**
 * Shared persistence backed by the GitHub repo itself.
 *
 * GET  — reads src/data/sectors.json from the repo (always the latest commit)
 * POST — commits an updated src/data/sectors.json back to the repo
 *
 * Requires a GITHUB_TOKEN env var (fine-grained PAT with Contents read/write
 * on this repo). Without it the app falls back to per-browser localStorage.
 */

export const dynamic = 'force-dynamic'

const REPO   = process.env.GITHUB_DATA_REPO?.trim() || 'skulkar8-debug/market-research-roadmap-stoc'
const BRANCH = process.env.GITHUB_DATA_BRANCH?.trim() || 'main'
const FILE   = 'src/data/sectors.json'

const token = () => process.env.GITHUB_TOKEN?.trim()

function gh(path: string, init?: RequestInit) {
  return fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
}

export async function GET() {
  if (!token()) return NextResponse.json({ configured: false })
  try {
    const res = await gh(`contents/${encodeURIComponent(FILE)}?ref=${encodeURIComponent(BRANCH)}`)
    if (!res.ok) {
      return NextResponse.json(
        { configured: true, error: `GitHub read failed (${res.status})` },
        { status: 502 }
      )
    }
    const body = await res.json()
    const sectors = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'))
    return NextResponse.json({ configured: true, sectors })
  } catch (err) {
    return NextResponse.json(
      { configured: true, error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    )
  }
}

export async function POST(req: NextRequest) {
  if (!token()) {
    return NextResponse.json(
      { error: 'not_configured', message: 'Set GITHUB_TOKEN to enable shared saves.' },
      { status: 503 }
    )
  }
  try {
    const { sectors } = await req.json()
    const valid =
      Array.isArray(sectors) &&
      sectors.length > 0 &&
      sectors.every(s => s && typeof s.id === 'string' && typeof s.name === 'string')
    if (!valid) {
      return NextResponse.json({ error: 'bad_request', message: 'Invalid sectors payload.' }, { status: 400 })
    }

    // Current file sha (required by the contents API to update in place)
    const cur = await gh(`contents/${encodeURIComponent(FILE)}?ref=${encodeURIComponent(BRANCH)}`)
    const sha = cur.ok ? (await cur.json()).sha : undefined

    const content = Buffer.from(JSON.stringify(sectors, null, 2) + '\n').toString('base64')
    const res = await gh(`contents/${encodeURIComponent(FILE)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Update roadmap data from the app',
        content,
        sha,
        branch: BRANCH,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'github_write_failed', message: body.message ?? `GitHub write failed (${res.status})` },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json(
      { error: 'save_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
