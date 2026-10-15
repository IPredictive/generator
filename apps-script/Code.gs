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

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '') : '';
  if (action === 'status') {
    const code = clean_(e.parameter.code, 30).toUpperCase();
    if (!/^APC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code)) {
      return jsonOutput_({ ok: false, error: 'Please enter a valid reference code.' });
    }
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      if (!sheet || sheet.getLastRow() < 2) {
        return jsonOutput_({ ok: false, error: 'We could not find that reference code.' });
      }
      const values = sheet.getDataRange().getValues();
      const headers = values[0].map(function(value) { return String(value).trim(); });
      const codeCol = headers.indexOf('Reference Code');
      const statusCol = headers.indexOf('Status');
      const dateCol = headers.indexOf('Submitted At');
      const packageCol = headers.indexOf('Package');
      if (codeCol < 0) return jsonOutput_({ ok: false, error: 'Inquiry records are not configured correctly.' });
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][codeCol]).trim().toUpperCase() === code) {
          const rawStatus = statusCol >= 0 ? String(values[i][statusCol] || 'New').trim() : 'New';
          const normalized = rawStatus.toLowerCase();
          let status = 'Received';
          if (normalized.indexOf('process') >= 0 || normalized.indexOf('progress') >= 0 || normalized.indexOf('review') >= 0) status = 'In progress';
          if (normalized.indexOf('complete') >= 0 || normalized.indexOf('deliver') >= 0 || normalized.indexOf('done') >= 0) status = 'Completed';
          const submitted = dateCol >= 0 && values[i][dateCol] instanceof Date
            ? Utilities.formatDate(values[i][dateCol], Session.getScriptTimeZone(), 'dd MMM yyyy')
            : '';
          return jsonOutput_({ ok: true, referenceCode: code, status: status, submittedDate: submitted, package: packageCol >= 0 ? String(values[i][packageCol] || '') : '' });
        }
      }
      return jsonOutput_({ ok: false, error: 'We could not find that reference code. Please check it and try again.' });
    } catch (err) {
      console.error(err && err.stack ? err.stack : err);
      return jsonOutput_({ ok: false, error: 'Status lookup is temporarily unavailable. Please try again later.' });
    }
  }
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
      body: body + '\n\nReference code: ' + referenceCode,
      replyTo: email,
      name: 'AplusCity Website'
    });

    // Send the customer a confirmation email. Do not lose the successful inquiry
    // response if the customer email cannot be delivered; the inquiry is already saved.
    try {
      const customerSubject = 'We received your AplusCity inquiry — ' + referenceCode;
      const customerBody = [
        'Hi ' + name + ',',
        '',
        'Thank you for contacting AplusCity AI Video Studio. We have received your inquiry.',
        '',
        'Your reference code is: ' + referenceCode,
        'Please keep this code for your records when following up with us.',
        '',
        'Package: ' + (packageName || 'Not selected'),
        'Business: ' + (business || 'Not provided'),
        '',
        'We will review your project details and get back to you by email.',
        '',
        'Best regards,',
        'AplusCity AI Video Studio',
        'inquiry@aplusachiever.com'
      ].join('\n');
      MailApp.sendEmail({
        to: email,
        subject: customerSubject,
        body: customerBody,
        name: 'AplusCity AI Video Studio',
        replyTo: NOTIFY_EMAIL
      });
    } catch (customerMailError) {
      console.error('Customer confirmation email failed: ' + customerMailError);
    }

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
