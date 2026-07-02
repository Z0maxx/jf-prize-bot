import { DataResult, Result } from '@jf-prize-bot/schema'
import { google } from 'googleapis'
import 'dotenv/config'
import credentials from '../google-cloud-creds.json'
import { getErrorResult } from './utils'

const auth = new google.auth.GoogleAuth({
  //@ts-ignore
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

export const spreadsheetId = process.env.SPREADSHEET_ID!
export const sheets = google.sheets({ version: 'v4', auth })

export async function getListFromSheetAsync<T>(
  sheetName: string,
  column: string = 'A',
): Promise<T[]> {
  const data = (
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${column}:${column}`,
    })
  ).data

  return (data.values ?? []).map((row) => JSON.parse(row[0]) as T)
}

export async function getListFromSheetAsResultAsync<T>(
  sheetName: string,
  column: string = 'A',
): Promise<DataResult<T[]>> {
  try {
    const data = await getListFromSheetAsync<T>(sheetName, column)
    return {
      success: true,
      data,
    }
  } catch (err) {
    return getErrorResult(err)
  }
}

export async function saveListToSheetAsync(sheetName: string, values: any[], column: string = 'A') {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!${column}:${column}`,
  })

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!${column}1`,
    valueInputOption: 'RAW',
    requestBody: { values: values.map((value) => [JSON.stringify(value)]) },
  })
}

export async function saveListToSheetWithResultAsync(
  sheetName: string,
  values: any[],
  column: string = 'A',
): Promise<Result> {
  try {
    await saveListToSheetAsync(sheetName, values, column)
    return {
      success: true,
    }
  } catch (err) {
    return getErrorResult(err)
  }
}
