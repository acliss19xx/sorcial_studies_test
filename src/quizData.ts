const GOOGLE_SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1s1b0iApsb5GRNP6mY8zPu74pCfPx1poSuaFTBmTw1QM/export?format=csv';
/**
 * GoogleスプレッドシートからCSVデータを非同期で取得します。
 * @returns {Promise<string>} CSVデータの文字列を解決するPromise。
 * @throws {Error} データの取得に失敗した場合。
 */

export const fetchCSVDataFromSheet = async (): Promise<string> => {
    if (GOOGLE_SPREADSHEET_CSV_URL !== 'https://docs.google.com/spreadsheets/d/1s1b0iApsb5GRNP6mY8zPu74pCfPx1poSuaFTBmTw1QM/export?format=csv' || !GOOGLE_SPREADSHEET_CSV_URL) {
        throw new Error("GoogleスプレッドシートのCSVエクスポートURLが設定されていません。src/quizData.ts を確認してください。");
    }

    const response = await fetch(GOOGLE_SPREADSHEET_CSV_URL);
    if (!response.ok) {
        throw new Error(`スプレッドシートからのデータの取得に失敗しました: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    return csvText;
};
