/**
 * Public, write-only receiver for the static trivia page.
 * Set SPREADSHEET_ID in this project's Script Properties, then run
 * setupResponsesSheet() once before deploying the web app.
 */

var RESPONSE_SHEET_NAME = 'Responses';
var RESPONSE_HEADERS = [
  'play_id', 'received_at', 'completed_at',
  'question_1', 'question_2', 'question_3', 'question_4', 'question_5'
];
var MAX_REQUEST_BYTES = 20000;
var MAX_ANSWER_CHARS = 2000;
var MAX_ANSWER_DEPTH = 4;
var MAX_CONTAINER_ENTRIES = 30;
var QUESTION_KEYS = [
  'question-1', 'question-2', 'question-3', 'question-4', 'question-5'
];

function doGet() {
  return jsonResponse_({ ok: true });
}

function doPost(e) {
  var request;
  try {
    request = parseRequest_(e);
  } catch (error) {
    return jsonResponse_({ accepted: false, error: 'invalid_request' });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var sheet = getResponsesSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var existing = sheet.getRange(2, 1, lastRow - 1, 1)
        .createTextFinder(request.playId)
        .matchEntireCell(true)
        .findNext();
      if (existing) {
        return jsonResponse_({ accepted: true, duplicate: true });
      }
    }

    var row = [request.playId, new Date().toISOString(), request.completedAt];
    QUESTION_KEYS.forEach(function (key) {
      row.push(safeCellText_(request.answers[key]));
    });
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return jsonResponse_({ accepted: true, duplicate: false });
  } catch (error) {
    console.error('Response write failed: ' + (error && error.stack || error));
    return jsonResponse_({ accepted: false, error: 'server_error' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

/** Run manually once from the Apps Script editor. Safe to run again. */
function setupResponsesSheet() {
  var spreadsheet = getSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(RESPONSE_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('@');
    sheet.getRange('D:H').setNumberFormat('@');
  } else {
    var actual = sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).getValues()[0];
    if (actual.some(function (value, index) { return value !== RESPONSE_HEADERS[index]; })) {
      throw new Error('Responses sheet has unexpected headers. No data was changed.');
    }
  }
  return spreadsheet.getUrl();
}

function parseRequest_(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string') {
    throw new Error('Missing body');
  }
  var body = e.postData.contents;
  if (Utilities.newBlob(body).getBytes().length > MAX_REQUEST_BYTES) {
    throw new Error('Body too large');
  }

  var request = JSON.parse(body);
  if (!request || typeof request !== 'object' || Array.isArray(request) ||
      request.version !== 1 ||
      typeof request.playId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.playId) ||
      typeof request.completedAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(request.completedAt) ||
      !isFinite(Date.parse(request.completedAt)) ||
      !request.answers || typeof request.answers !== 'object' ||
      Array.isArray(request.answers)) {
    throw new Error('Invalid envelope');
  }

  var answerKeys = Object.keys(request.answers);
  if (answerKeys.length !== QUESTION_KEYS.length ||
      QUESTION_KEYS.some(function (key) { return !Object.prototype.hasOwnProperty.call(request.answers, key); })) {
    throw new Error('Invalid answer keys');
  }
  QUESTION_KEYS.forEach(function (key) {
    var answer = request.answers[key];
    if (!isValidAnswerValue_(answer, 0) ||
        JSON.stringify(answer).length > MAX_ANSWER_CHARS) {
      throw new Error('Invalid answer');
    }
  });
  return request;
}

function isValidAnswerValue_(value, depth) {
  if (value === null) return depth > 0;
  if (typeof value === 'string') {
    return (depth > 0 || value.length > 0) && value.length <= MAX_ANSWER_CHARS;
  }
  if (typeof value === 'number') return isFinite(value);
  if (typeof value === 'boolean') return true;
  if (depth >= MAX_ANSWER_DEPTH || typeof value !== 'object') return false;

  if (Array.isArray(value)) {
    return (depth > 0 || value.length > 0) && value.length <= MAX_CONTAINER_ENTRIES &&
      value.every(function (item) { return isValidAnswerValue_(item, depth + 1); });
  }
  var keys = Object.keys(value);
  return (depth > 0 || keys.length > 0) && keys.length <= MAX_CONTAINER_ENTRIES &&
    keys.every(function (key) {
      return key.length > 0 && key.length <= MAX_ANSWER_CHARS &&
        isValidAnswerValue_(value[key], depth + 1);
    });
}

function safeCellText_(answer) {
  var text = typeof answer === 'string' ? answer : JSON.stringify(answer);
  // Sheets treats a leading equals sign as a formula. Prefix other common
  // spreadsheet formula prefixes too, even when preceded by whitespace.
  return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
}

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Missing SPREADSHEET_ID Script Property');
  return SpreadsheetApp.openById(id);
}

function getResponsesSheet_() {
  var sheet = getSpreadsheet_().getSheetByName(RESPONSE_SHEET_NAME);
  if (!sheet) throw new Error('Responses sheet is missing; run setupResponsesSheet');
  var actual = sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).getValues()[0];
  if (actual.some(function (value, index) { return value !== RESPONSE_HEADERS[index]; })) {
    throw new Error('Responses sheet headers do not match');
  }
  return sheet;
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
