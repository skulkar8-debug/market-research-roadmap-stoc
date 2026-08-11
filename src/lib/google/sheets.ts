import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { ROADMAP_SHEET_ID } from './config'
import { getAuthenticatedClient } from './oauth'

function quoteSheetTab(tab: string): string {
  const escaped = tab.replace(/'/g, "''")
  return `'${escaped}'`
}

export async function requireAuthenticatedClient(): Promise<OAuth2Client> {
  const client = await getAuthenticatedClient()
  if (!client) {
    const err = new Error('Not authenticated with Google') as Error & { status?: number }
    err.status = 401
    throw err
  }
  return client
}

export async function fetchSheetValues(
  auth: OAuth2Client,
  spreadsheetId: string,
  tabName: string,
  range = 'A:ZZ'
): Promise<string[][]> {
  const sheets = google.sheets({ version: 'v4', auth })
  const a1Range = `${quoteSheetTab(tabName)}!${range}`

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: a1Range,
    valueRenderOption: 'FORMATTED_VALUE',
  })

  return (res.data.values ?? []).map((row) =>
    row.map((cell) => String(cell ?? '').trim())
  )
}

export async function fetchRoadmapTab(tabName: string): Promise<string[][]> {
  const auth = await requireAuthenticatedClient()
  return fetchSheetValues(auth, ROADMAP_SHEET_ID, tabName)
}
