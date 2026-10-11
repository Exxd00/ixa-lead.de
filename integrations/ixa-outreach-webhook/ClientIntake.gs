// Extends the existing authenticated IXA receiver. Never creates or removes sheets.
function saveClientIntake_(spreadsheet, body) {
  if (spreadsheet.getId() !== "1YFYLQPMSdCzq6ArY0szD93qnfBHIub7yy-WnKDfGhoY") return json_({ ok: false, error: "wrong_intake_workbook" });
  const sheet = spreadsheet.getSheetByName("15 Kunden-Websites");
  if (!sheet || sheet.getSheetId() !== 151026001) return json_({ ok: false, error: "intake_sheet_not_prepared" });
  const id = String(body.submissionId || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return json_({ ok: false, error: "invalid_intake_id" });
  if (["save", "email_accepted", "claim_tracking"].indexOf(body.operation) < 0) return json_({ ok: false, error: "invalid_intake_operation" });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, error: "busy" });
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const idCol = headers.indexOf("Vorgang-ID") + 1;
    const digestCol = headers.indexOf("Inhalt-Prüfsumme") + 1;
    const emailCol = headers.indexOf("E-Mail-Status") + 1;
    const providerCol = headers.indexOf("E-Mail-ID") + 1;
    const trackingCol = headers.indexOf("GA4-Sendeversuch (UTC)") + 1;
    if (!idCol || !digestCol || !emailCol || !providerCol || !trackingCol || headers.length !== 43) return json_({ ok: false, error: "intake_schema_mismatch" });
    let row = 0;
    if (sheet.getLastRow() > 1) {
      const match = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).useRegularExpression(false).findNext();
      if (match) row = match.getRow();
    }
    let duplicate = Boolean(row);
    if (body.operation === "save") {
      if (!Array.isArray(body.headers) || JSON.stringify(body.headers) !== JSON.stringify(headers) || !Array.isArray(body.values) || body.values.length !== headers.length || body.values.some(function (value) { return typeof value !== "string" || value.length > 4000; }) || !/^[a-f0-9]{32}$/.test(String(body.digest || "")) || body.values[idCol - 1] !== id || body.values[digestCol - 1] !== body.digest) return json_({ ok: false, error: "invalid_intake_payload" });
      if (row && sheet.getRange(row, digestCol).getDisplayValue() !== body.digest) return json_({ ok: false, error: "intake_id_conflict" });
      if (!row) {
        row = Math.max(2, sheet.getLastRow() + 1);
        if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
        const values = body.values.map(function (value) { return /^[=+\-@]/.test(value) ? "'" + value : value; });
        sheet.getRange(row, 1, 1, headers.length).setNumberFormat("@").setValues([values]).setWrap(true).setVerticalAlignment("top");
        sheet.setRowHeight(row, 82);
      }
    } else if (!row) {
      return json_({ ok: false, error: "intake_not_found" });
    }
    let sendEvent = false;
    if (body.operation === "email_accepted") {
      if (sheet.getRange(row, digestCol).getDisplayValue() !== body.digest || typeof body.emailId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.emailId)) return json_({ ok: false, error: "invalid_email_receipt" });
      sheet.getRange(row, emailCol).setValue("Von Versanddienst angenommen");
      sheet.getRange(row, providerCol).setNumberFormat("@").setValue(body.emailId);
    }
    if (body.operation === "claim_tracking") {
      sendEvent = !sheet.getRange(row, trackingCol).getDisplayValue();
      if (sendEvent) sheet.getRange(row, trackingCol).setNumberFormat("@").setValue(new Date().toISOString());
    }
    SpreadsheetApp.flush();
    return json_({ ok: true, submissionId: id, sheetId: sheet.getSheetId(), rowNumber: row, duplicate: duplicate, emailAccepted: Boolean(sheet.getRange(row, providerCol).getDisplayValue()), sendEvent: sendEvent });
  } finally { lock.releaseLock(); }
}
