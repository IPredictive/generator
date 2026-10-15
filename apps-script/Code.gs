/**
 * AplusCity Customer Inquiry endpoint
 * Spreadsheet: 1EDnEeWa6fzqZ_RATicIznZ4FWqcq28i7zeeWPGSmPco
 *
 * Deploy as a Web app:
 * Execute as: Me
 * Who has access: Anyone
 *
 * Then copy the Web app URL ending in /exec into the website's inquiry form.
 */

const SPREADSHEET_ID = '1EDnEeWa6fzqZ_RATicIznZ4FWqcq28i7zeeWPGSmPco';
const NOTIFY_EMAIL = 'inquiry@aplusachiever.com';
const SHEET_NAME = 'Inquiries';
const CODE_PREFIX = 'APC';

function doGet() {
  return jsonOutput_({
    ok: true,
    service: 'AplusCity inquiry endpoint',
    message: 'Endpoint is online. Submit inquiries using the website form.'
  });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    // Basic honeypot: bots often fill hidden fields.
    if (payload.website) {
      return jsonOutput_({ ok: true, message: 'Received' });
    }

    const name = clean_(payload.name, 120);
    const email = clean_(payload.email, 254);
    const business = clean_(payload.business, 160);
    const packageName = clean_(payload.package, 100);
    const details = clean_(payload.details, 4000);

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonOutput_({ ok: false, error: 'Please provide a valid name and email.' });
    }

    let referenceCode = '';
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let sheet;
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Submitted At', 'Reference Code', 'Name', 'Business', 'Email', 'Package', 'Project Details', 'Status']);
        sheet.setFrozenRows(1);
      } else {
        // Add the reference-code column to an existing sheet if it uses the earlier layout.
        const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (header.indexOf('Reference Code') === -1) {
          sheet.insertColumnAfter(1);
          sheet.getRange(1, 2).setValue('Reference Code');
        }
      }
      referenceCode = createReferenceCode_();
      sheet.appendRow([new Date(), referenceCode, name, business, email, packageName, details, 'New']);
    } finally {
      lock.releaseLock();
    }

    const subject = 'New AplusCity project inquiry — ' + name;
    const body = [
      'A new inquiry was submitted on the AplusCity AI Video Studio website.',
      '',
      'Name: ' + name,
      'Business: ' + (business || 'Not provided'),
      'Email: ' + email,
      'Package: ' + (packageName || 'Not selected'),
      '',
      'Project details:',
      details || 'Not provided',
      '',
      'The inquiry has been saved to the AplusCity Customer Inquiries spreadsheet.'
    ].join('\n');

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      body: body,
      replyTo: email,
      name: 'AplusCity Website'
    });

    return jsonOutput_({ ok: true, message: 'Your inquiry has been received.', referenceCode: referenceCode });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return jsonOutput_({ ok: false, error: 'We could not submit your inquiry right now. Please try again or email inquiry@aplusachiever.com directly.' });
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return (e && e.parameter) || {};
  const contents = String(e.postData.contents).trim();
  // Accept JSON even when browsers send it as text/plain to avoid preflight/CORS issues.
  if (contents.charAt(0) === '{') {
    try { return JSON.parse(contents); } catch (err) { throw new Error('Invalid JSON request body.'); }
  }
  return e.parameter || {};
}

function createReferenceCode_() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  return CODE_PREFIX + '-' + token.slice(0, 4) + '-' + token.slice(4);
}

function clean_(value, maxLength) {
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
