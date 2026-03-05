/**
 * 毎月1日に「最終送信日」列（J列）をクリアするスクリプト
 * 
 * 設定方法:
 * 1. スプレッドシートの「拡張機能」>「Apps Script」を選択
 * 2. このコードを貼り付ける
 * 3. 左側の「トリガー（時計アイコン）」を選択
 * 4. 「トリガーを追加」をクリック
 * 5. 実行する関数: resetMonthlySendHistory
 * 6. イベントのソースを選択: 時間主導型
 * 7. 時間ベースのトリガーのタイプを選択: 月ごと
 * 8. 日を選択: 1日
 * 9. 時刻を選択: 午前0時〜1時（任意の時間）
 */
function resetMonthlySendHistory() {
    var spreadsheetId = '1WrPey4LrG4ihA8eTtMF-rm340_TyFjWclSaw7o-OAuc'; // スプレッドシートID
    var sheetName = 'My-page';
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheetByName(sheetName);

    // シートの全データを取得
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return; // ヘッダーのみの場合は終了

    // 最終送信日列（J列 = 10列目）のデータをクリア
    // 2行目から最終行までを空白にする
    sheet.getRange(2, 10, lastRow - 1, 1).clearContent();

    console.log('Monthly reset completed: Last Sent Date column cleared.');
}
