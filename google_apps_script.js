/**
 * たっちレディオ 投票＆コミュニティ共同編集システム Google Apps Script (GAS)
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {
    votes: getSheetRecords(ss, "投票一覧"),
    meigen_summary: getSheetRecords(ss, "名言集計"),
    heisoku_summary: getSheetRecords(ss, "閉塞感集計"),
    custom_items: getSheetRecords(ss, "自由投稿一覧"),
    comments: getSheetRecords(ss, "コメント・フラグ一覧")
  };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var timestamp = new Date();
    
    // 1. 自由投稿の共有保存 (全リスナーにリアルタイム同期)
    if (data.type === "custom_item") {
      var customSheet = ss.getSheetByName("自由投稿一覧");
      if (!customSheet) {
        customSheet = ss.insertSheet("自由投稿一覧");
        customSheet.appendRow(["受付日時", "ID", "カテゴリ", "発言者/種別", "内容", "詳細・文脈", "関連放送回"]);
        customSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#fdf4ff");
        customSheet.setFrozenRows(1);
      }
      customSheet.appendRow([
        timestamp,
        data.item.id || "",
        data.item.category || (data.category === "heisoku" ? "閉塞感" : "名言"),
        data.item.speaker || data.item.source || "",
        data.item.quote || data.item.title || "",
        data.item.context || data.item.detail || "",
        data.item.episode || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "自由投稿を共有保存しました！" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. コメント・フラグの投稿（前処理・レビュー）
    if (data.type === "comment_flag") {
      var commentSheet = ss.getSheetByName("コメント・フラグ一覧");
      if (!commentSheet) {
        commentSheet = ss.insertSheet("コメント・フラグ一覧");
        commentSheet.appendRow(["受付日時", "項目カテゴリ", "対象ID", "フラグ", "コメント・メモ", "投稿者ネーム"]);
        commentSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#fed7aa");
        commentSheet.setFrozenRows(1);
      }
      commentSheet.appendRow([
        timestamp,
        data.category || "名言",
        data.card_id || "",
        data.flag || "コメント",
        data.comment || "",
        data.name || "匿名リスナー"
      ]);
      
      updateMasterNote(ss, data.category === "閉塞感" ? "閉塞感マスター" : "名言マスター", data.card_id, data.flag, data.comment, data.name);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "コメント・フラグを記録しました！" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. 閉塞感の表現改善提案
    if (data.type === "heisoku_suggestion") {
      var suggSheet = ss.getSheetByName("閉塞感改善提案");
      if (!suggSheet) {
        suggSheet = ss.insertSheet("閉塞感改善提案");
        suggSheet.appendRow(["受付日時", "対象カードID", "現在のタイトル", "提案された新タイトル", "提案理由・補足", "提案者ネーム"]);
        suggSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#fef08a");
        suggSheet.setFrozenRows(1);
      }
      suggSheet.appendRow([
        timestamp,
        data.card_id || "",
        data.orig_title || "",
        data.new_title || "",
        data.reason || "",
        data.name || "匿名リスナー"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "提案を受け付けました！" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. 通常の投票送信
    var rawSheet = ss.getSheetByName("投票一覧");
    if (!rawSheet) {
      rawSheet = ss.insertSheet("投票一覧");
      rawSheet.appendRow([
        "受付日時", "お名前/ニックネーム", "名言選択数", "選択した名言ID", "選択した名言内容", 
        "閉塞感選択数", "選択した閉塞感ID", "選択した閉塞感内容", "自由投稿名言", "自由投稿閉塞感"
      ]);
      rawSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f3f4f6");
      rawSheet.setFrozenRows(1);
    }
    
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
      timestamp, name, meigens.length, meigenIds, meigenTexts,
      heisokus.length, heisokuIds, heisokuTexts, customMStr, customHStr
    ]);
    
    updateSummarySheet(ss, meigens, "名言集計");
    updateSummarySheet(ss, heisokus, "閉塞感集計");
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "投票を受け付けました！" })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateMasterNote(ss, sheetName, cardId, flag, comment, name) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == cardId) {
      var row = i + 1;
      sheet.getRange(row, 6).setValue(flag);
      var oldNote = sheet.getRange(row, 7).getValue() || "";
      var newNote = "[" + flag + "] " + comment + " (by " + name + ")";
      sheet.getRange(row, 7).setValue(oldNote ? oldNote + "\n" + newNote : newNote);
      break;
    }
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

function getSheetRecords(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    rows.push(obj);
  }
  return rows;
}
