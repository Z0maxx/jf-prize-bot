import credentials from "./google-cloud-creds.json"
import { google } from "googleapis"
import "dotenv/config"

const auth = new google.auth.GoogleAuth({
  //@ts-ignore
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
})

export const spreadsheetId = process.env.SPREADSHEET_ID!
export const sheets = google.sheets({ version: "v4", auth })

export async function getListFromSheetAsync<T>(sheetName: string, column: string) {
  const data = (await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${column}:${column}`,
  })).data

  return (data.values ?? []).map(row => JSON.parse(row[0]) as T)
}

export async function saveListToSheetAsync(sheetName: string, column: string, values: any[]) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!${column}:${column}`
  })

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!${column}1`,
    valueInputOption: 'RAW',
    requestBody: { values: values.map(value => [JSON.stringify(value)]) }
  })
}