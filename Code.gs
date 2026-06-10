function doGet(e) {
  var action = e.parameter.action;

  if (action === 'debug') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets().map(function(s) { return s.getName(); });
    return ContentService.createTextOutput(JSON.stringify({ sheets: sheets }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'login') {
    var username = e.parameter.username;
    var password = e.parameter.password;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('username');
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === username && String(data[i][1]) === String(password)) {
        var name = data[i][2] || username;
        var email = data[i][0];
        var course = data[i][3] || 'Beginner Course';
        upsertUserProgress(ss, email, name, course);
        return ContentService.createTextOutput(JSON.stringify({
          success: true, name: name, email: email, course: course
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'loginWithProgress') {
    var username = e.parameter.username;
    var password = e.parameter.password;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('username');
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === username && String(data[i][1]) === String(password)) {
        var name = data[i][2] || username;
        var email = data[i][0];
        var course = data[i][3] || 'Beginner Course';
        upsertUserProgress(ss, email, name, course);

        var result = { found: false, ch1: null, ch2: null };

        var ch1Sheet = ss.getSheetByName('Where We Play Responses') || ss.getSheetByName('Chapter 1 Responses');
        if (ch1Sheet) {
          var ch1Data = ch1Sheet.getDataRange().getValues();
          for (var j = ch1Data.length - 1; j >= 1; j--) {
            if (String(ch1Data[j][2]).toLowerCase() === String(email).toLowerCase()) {
              result.found = true;
              result.ch1 = { q1: ch1Data[j][3]||'', q2: ch1Data[j][4]||'', q3: ch1Data[j][5]||'', q4: ch1Data[j][6]||'', q5: ch1Data[j][7]||'' };
              break;
            }
          }
        }

        var ch2Sheet = ss.getSheetByName('Who We Are Responses') || ss.getSheetByName('Chapter 2 Responses');
        if (ch2Sheet) {
          var ch2Data = ch2Sheet.getDataRange().getValues();
          for (var k = ch2Data.length - 1; k >= 1; k--) {
            if (String(ch2Data[k][2]).toLowerCase() === String(email).toLowerCase()) {
              result.found = true;
              result.ch2 = { q1: ch2Data[k][3]||'', q2: ch2Data[k][4]||'', q3: ch2Data[k][5]||'', q4: ch2Data[k][6]||'' };
              break;
            }
          }
        }

        return ContentService.createTextOutput(JSON.stringify({
          success: true, name: name, email: email, course: course, progress: result
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getProgress') {
    var email = e.parameter.email;
    if (!email) return ContentService.createTextOutput(JSON.stringify({ found: false }))
      .setMimeType(ContentService.MimeType.JSON);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = { found: false, ch1: null, ch2: null };

    var ch1Sheet = ss.getSheetByName('Where We Play Responses') || ss.getSheetByName('Chapter 1 Responses');
    if (ch1Sheet) {
      var ch1Data = ch1Sheet.getDataRange().getValues();
      for (var j = ch1Data.length - 1; j >= 1; j--) {
        if (String(ch1Data[j][2]).toLowerCase() === String(email).toLowerCase()) {
          result.found = true;
          result.ch1 = { q1: ch1Data[j][3]||'', q2: ch1Data[j][4]||'', q3: ch1Data[j][5]||'', q4: ch1Data[j][6]||'', q5: ch1Data[j][7]||'' };
          break;
        }
      }
    }

    var ch2Sheet = ss.getSheetByName('Who We Are Responses') || ss.getSheetByName('Chapter 2 Responses');
    if (ch2Sheet) {
      var ch2Data = ch2Sheet.getDataRange().getValues();
      for (var i = ch2Data.length - 1; i >= 1; i--) {
        if (String(ch2Data[i][2]).toLowerCase() === String(email).toLowerCase()) {
          result.found = true;
          result.ch2 = { q1: ch2Data[i][3]||'', q2: ch2Data[i][4]||'', q3: ch2Data[i][5]||'', q4: ch2Data[i][6]||'' };
          break;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'admin') {
    var key = e.parameter.key;
    if (key !== 'myHQBuddyadmin') return ContentService.createTextOutput(JSON.stringify({ success: false }))
      .setMimeType(ContentService.MimeType.JSON);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var userSheet = ss.getSheetByName('username');
    var userData = userSheet.getDataRange().getValues();
    var users = {};
    for (var i = 1; i < userData.length; i++) {
      var email = String(userData[i][0]).toLowerCase().trim();
      if (!email) continue;
      users[email] = {
        name: userData[i][2] || userData[i][0],
        email: userData[i][0],
        course: userData[i][3] || 'Beginner Course',
        ch1: false, ch1_submitted_at: null,
        ch2: false, ch2_submitted_at: null
      };
    }

    var ch1Sheet = ss.getSheetByName('Where We Play Responses') || ss.getSheetByName('Chapter 1 Responses');
    if (ch1Sheet) {
      var ch1Data = ch1Sheet.getDataRange().getValues();
      for (var r = 1; r < ch1Data.length; r++) {
        var rowEmail = String(ch1Data[r][2]).toLowerCase().trim();
        if (users[rowEmail]) {
          users[rowEmail].ch1 = true;
          users[rowEmail].ch1_submitted_at = ch1Data[r][0] ? String(ch1Data[r][0]) : null;
        }
      }
    }

    var ch2Sheet = ss.getSheetByName('Who We Are Responses') || ss.getSheetByName('Chapter 2 Responses');
    if (ch2Sheet) {
      var ch2Data = ch2Sheet.getDataRange().getValues();
      for (var r = 1; r < ch2Data.length; r++) {
        var rowEmail = String(ch2Data[r][2]).toLowerCase().trim();
        if (users[rowEmail]) {
          users[rowEmail].ch2 = true;
          users[rowEmail].ch2_submitted_at = ch2Data[r][0] ? String(ch2Data[r][0]) : null;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, users: users }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput('OK');
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Sheet name is always "[chapterName] Responses" — created automatically if it doesn't exist
    var chapterName = data.chapterName || data.chapter || 'Unknown Chapter';
    var sheetName = chapterName + ' Responses';

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Generic header — enough columns for up to 10 questions
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10']);
    }

    // Build answer row — include all q1–q10 fields if present
    var row = [
      data.timestamp || nowIST(),
      data.name || '—',
      data.email || '—',
      data.q1 || '', data.q2 || '', data.q3 || '', data.q4 || '',
      data.q5 || '', data.q6 || '', data.q7 || '', data.q8 || '',
      data.q9 || '', data.q10 || ''
    ];
    sheet.appendRow(row);

    // Update User Progress sheet
    if (data.email && data.email !== '—') {
      var progressSheet = getOrCreateProgressSheet(ss);
      var emailLower = String(data.email).toLowerCase().trim();

      var progressData = progressSheet.getDataRange().getValues();
      var userRow = -1;
      for (var i = 1; i < progressData.length; i++) {
        if (String(progressData[i][0]).toLowerCase().trim() === emailLower) {
          userRow = i + 1;
          break;
        }
      }

      if (userRow > 0) {
        var completionStatus = data.status || 'Completed';
        var statusCol = findOrCreateChapterColumns(progressSheet, chapterName);
        progressSheet.getRange(userRow, statusCol).setValue(completionStatus);
        progressSheet.getRange(userRow, statusCol + 1).setValue(nowIST());
      }
    }

    return ContentService.createTextOutput('OK');
  } catch(err) {
    return ContentService.createTextOutput('Error: ' + err.message);
  }
}

// Finds the status column for a chapter by name, handling legacy Ch1/Ch2 headers.
// Renames legacy headers to the chapter name on first match.
// Creates new columns if the chapter has never been tracked before.
function findOrCreateChapterColumns(sheet, chapterName) {
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var legacyMap = {
    'Where We Play': 'Ch1 Status',
    'Who We Are': 'Ch2 Status'
  };
  var legacyHeader = legacyMap[chapterName] || null;
  var statusHeader = chapterName + ' Status';

  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === statusHeader || (legacyHeader && headers[i] === legacyHeader)) {
      if (headers[i] === legacyHeader) {
        sheet.getRange(1, i + 1).setValue(statusHeader);
        sheet.getRange(1, i + 2).setValue(chapterName + ' Submitted At');
      }
      return i + 1;
    }
  }

  // Not found — create new columns
  var newCol = lastCol + 1;
  sheet.getRange(1, newCol).setValue(statusHeader);
  sheet.getRange(1, newCol + 1).setValue(chapterName + ' Submitted At');
  return newCol;
}

function nowIST() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
}

function upsertUserProgress(ss, email, name, course) {
  var sheet = getOrCreateProgressSheet(ss);
  var data = sheet.getDataRange().getValues();
  var emailLower = String(email).toLowerCase().trim();
  var now = nowIST();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === emailLower) {
      sheet.getRange(i + 1, 4).setValue(now);
      return;
    }
  }
  // New user — fixed columns only; chapter columns added dynamically on first submission
  sheet.appendRow([email, name, course, now]);
}

function getOrCreateProgressSheet(ss) {
  var sheet = ss.getSheetByName('User Progress');
  if (!sheet) {
    sheet = ss.insertSheet('User Progress');
    sheet.appendRow(['Email', 'Name', 'Course', 'Last Login']);
  }
  return sheet;
}
