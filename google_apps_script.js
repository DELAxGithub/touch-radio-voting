/**
 * たっちレディオ 投票フォーム用 Google Apps Script (GAS)
 * 
 * 【使い方】
 * 1. Googleドライブで新規「Googleスプレッドシート」を作成
 * 2. メニューの「拡張機能」→「Apps Script」を開く
 * 3. エディタにこのコードを貼り付けて保存（Ctrl+S / Cmd+S）
 * 4. 右上の青い「デプロイ」ボタン →「新しいデプロイ」をクリック
 *    - 種類の選択（歯車アイコン）: 「ウェブアプリ」
 *    - 説明: たっちレディオ投票API
 *    - 次のユーザーとして実行: 「自分」
 *    - アクセスできるユーザー: 「全員」 (※重要)
 * 5. 「デプロイ」を押して発行された「ウェブアプリのURL」をコピー！
 * 6. この投票フォームの送信画面にある「GAS URL」欄に貼り付ければ連携完了です！
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. 個別回答シート（生データ）
    var rawSheet = ss.getSheetByName("投票一覧");
    if (!rawSheet) {
      rawSheet = ss.insertSheet("投票一覧");
      rawSheet.appendRow([
        "受付日時", 
        "お名前/ニックネーム", 
        "名言選択数", 
        "選択した名言ID", 
        "選択した名言内容", 
        "閉塞感選択数", 
        "選択した閉塞感ID", 
        "選択した閉塞感内容", 
        "自由投稿名言", 
        "自由投稿閉塞感"
      ]);
      rawSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f3f4f6");
      rawSheet.setFrozenRows(1);
    }
    
    var timestamp = new Date();
    var name = data.name || "匿名リスナー";
    var meigens = data.meigens || [];
    var heisokus = data.heisokus || [];
    var customMeigens = data.customMeigens || [];
    var customHeisokus = data.customHeisokus || [];
    
    var meigenIds = meigens.map(function(m) { return m.id; }).join(", ");
    var meigenTexts = meigens.map(function(m) { return m.id + ": " + (m.quote || m.title); }).join("\n");
    
    var heisokuIds = heisokus.map(function(h) { return h.id; }).join(", ");
    var heisokuTexts = heisokus.map(function(h) { return h.id + ": " + h.title; }).join("\n");
    
    var customMStr = customMeigens.map(function(m) { return "【" + m.speaker + "】" + m.quote + " (" + m.context + ")"; }).join("\n");
    var customHStr = customHeisokus.map(function(h) { return h.title + " (" + h.detail + ")"; }).join("\n");
    
    rawSheet.appendRow([
      timestamp,
      name,
      meigens.length,
      meigenIds,
      meigenTexts,
      heisokus.length,
      heisokuIds,
      heisokuTexts,
      customMStr,
      customHStr
    ]);
    
    // 2. 得票集計シート（自動カウント・ランキング用）
    updateSummarySheet(ss, meigens, "名言集計");
    updateSummarySheet(ss, heisokus, "閉塞感集計");
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "投票を受け付けました！"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateSummarySheet(ss, items, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["項目ID", "内容", "発言者/種別", "得票数"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#e0f2fe");
    sheet.setFrozenRows(1);
  }
  
  var data = sheet.getDataRange().getValues();
  var rowMap = {};
  for (var i = 1; i < data.length; i++) {
    rowMap[data[i][0]] = i + 1;
  }
  
  items.forEach(function(item) {
    var id = item.id;
    var content = item.quote || item.title || "";
    var speaker = item.speaker || item.source || "";
    
    if (rowMap[id]) {
      var r = rowMap[id];
      var currentVotes = sheet.getRange(r, 4).getValue() || 0;
      sheet.getRange(r, 4).setValue(currentVotes + 1);
    } else {
      sheet.appendRow([id, content, speaker, 1]);
      rowMap[id] = sheet.getLastRow();
    }
  });
}
