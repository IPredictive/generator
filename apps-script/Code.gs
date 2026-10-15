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

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let sheet;
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Submitted At', 'Name', 'Business', 'Email', 'Package', 'Project Details', 'Status']);
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([new Date(), name, business, email, packageName, details, 'New']);
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

    return jsonOutput_({ ok: true, message: 'Your inquiry has been received.' });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return jsonOutput_({ ok: false, error: 'We could not submit your inquiry right now. Please try again or email inquiry@aplusachiever.com directly.' });
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const contentType = String(e.postData.type || '').toLowerCase();
  if (contentType.indexOf('application/json') !== -1) {
    return JSON.parse(e.postData.contents);
  }
  return e.parameter || {};
}

function clean_(value, maxLength) {
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
