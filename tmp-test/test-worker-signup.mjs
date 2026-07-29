import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = 'http://127.0.0.1:5174';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function collectPageSignals(page) {
  const alertText = await page.locator('[role="alert"]').allTextContents().catch(() => []);
  const toastText = await page.locator('[data-sonner-toast], [data-sonner-toaster] li, .sonner-toast, [class*="toast"]').allTextContents().catch(() => []);
  // sonner often uses li[data-sonner-toast]
  const sonner = await page.locator('li[data-sonner-toast]').allTextContents().catch(() => []);
  const bodySnippet = await page.evaluate(() => {
    const alerts = [...document.querySelectorAll('[role="alert"]')].map(e => e.innerText.trim());
    const toasts = [...document.querySelectorAll('[data-sonner-toast]')].map(e => e.innerText.trim());
    const warning = [...document.querySelectorAll('.text-warning, [class*="warning"]')].map(e => e.innerText.trim()).filter(Boolean).slice(0, 5);
    return { alerts, toasts, warning, url: location.href, title: document.title };
  });
  return { alertText, toastText, sonner, ...bodySnippet };
}

async function screenshot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: true });
  return p;
}

const report = { sms: {}, email: {}, consoleErrors: [], pageErrors: [] };

const browser = await chromium.launch({
  channel: 'chrome',
  channel: 'chrome',
  headless: true,
  args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'en-IN',
});
const page = await context.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') report.consoleErrors.push(msg.text());
});
page.on('pageerror', err => report.pageErrors.push(String(err)));

// ========== SMS PATH ==========
console.log('=== SMS PATH ===');
await page.goto(`${BASE}/worker/quick-signup`, { waitUntil: 'networkidle', timeout: 60000 });
await sleep(1500);
report.sms.screenshotInitial = await screenshot(page, 'sms-01-initial.png');

// Check Firebase availability warning
const firebaseWarn = await page.locator('text=SMS OTP needs Firebase').count();
report.sms.firebaseUnavailableWarning = firebaseWarn > 0;

// Ensure Mobile tab
await page.getByRole('tab', { name: /Mobile/i }).click().catch(() => {});
await page.fill('#name', 'Test Worker Kailash');
await page.fill('#mobile', '9549230227');
// Country should default to India
report.sms.screenshotFilled = await screenshot(page, 'sms-02-filled.png');

await page.getByRole('button', { name: /Send SMS code/i }).click();
console.log('Clicked Send SMS code, waiting...');

// Wait for either OTP step, error alert, or toast
let smsOutcome = 'timeout';
for (let i = 0; i < 40; i++) {
  await sleep(500);
  const signals = await collectPageSignals(page);
  const onOtp = await page.locator('text=Enter the 6-digit SMS code').count();
  const hasError = signals.alerts.length > 0 || (signals.alertText && signals.alertText.length);
  const hasToast = (signals.toasts && signals.toasts.length) || (signals.sonner && signals.sonner.length);
  if (onOtp > 0) {
    smsOutcome = 'otp_step';
    report.sms.signals = signals;
    break;
  }
  if (hasError || hasToast) {
    // give toast a moment to settle
    await sleep(800);
    report.sms.signals = await collectPageSignals(page);
    if (await page.locator('text=Enter the 6-digit SMS code').count() > 0) {
      smsOutcome = 'otp_step';
    } else if (report.sms.signals.alerts?.length || report.sms.signals.alertText?.length) {
      smsOutcome = 'error';
    } else {
      smsOutcome = 'toast_or_partial';
    }
    break;
  }
  // still loading?
  const loading = await page.locator('button:has-text("Send SMS code") svg.animate-spin').count().catch(() => 0);
  if (i === 39) {
    report.sms.signals = signals;
    smsOutcome = loading ? 'still_loading' : 'no_visible_change';
  }
}

report.sms.outcome = smsOutcome;
report.sms.url = page.url();
report.sms.screenshotAfterSend = await screenshot(page, 'sms-03-after-send.png');
report.sms.otpSentLikely = smsOutcome === 'otp_step';
console.log('SMS outcome:', smsOutcome, JSON.stringify(report.sms.signals, null, 2));

// ========== EMAIL PATH (fresh context) ==========
console.log('=== EMAIL PATH ===');
const emailPage = await context.newPage();
emailPage.on('console', msg => {
  if (msg.type() === 'error') report.consoleErrors.push('[email] ' + msg.text());
});
emailPage.on('pageerror', err => report.pageErrors.push('[email] ' + String(err)));

const uniqueEmail = `test.worker.9549230227.${Date.now()}@example.com`;
report.email.emailUsed = uniqueEmail;

await emailPage.goto(`${BASE}/worker/quick-signup`, { waitUntil: 'networkidle', timeout: 60000 });
await sleep(1000);
await emailPage.getByRole('tab', { name: /Email/i }).click();
await sleep(300);
await emailPage.fill('#name', 'Test Worker Kailash');
await emailPage.fill('#email', uniqueEmail);
report.email.screenshotFilled = await screenshot(emailPage, 'email-01-filled.png');

await emailPage.getByRole('button', { name: /Create account/i }).click();
console.log('Clicked Create account, waiting...');

let emailOutcome = 'timeout';
for (let i = 0; i < 50; i++) {
  await sleep(500);
  const url = emailPage.url();
  const signals = await collectPageSignals(emailPage);
  if (url.includes('/worker/trust') || url.includes('/worker/onboarding') || url.includes('/worker/dashboard')) {
    emailOutcome = 'redirect_success';
    report.email.signals = signals;
    report.email.finalUrl = url;
    break;
  }
  if (signals.alerts?.length || signals.alertText?.length) {
    await sleep(500);
    report.email.signals = await collectPageSignals(emailPage);
    report.email.finalUrl = emailPage.url();
    emailOutcome = 'error';
    break;
  }
  if (i === 49) {
    report.email.signals = signals;
    report.email.finalUrl = url;
    emailOutcome = 'no_redirect';
  }
}

report.email.outcome = emailOutcome;
report.email.screenshotAfter = await screenshot(emailPage, 'email-02-after-submit.png');
console.log('Email outcome:', emailOutcome, report.email.finalUrl);

// If redirected, try one more screenshot of trust page
if (emailOutcome === 'redirect_success') {
  await sleep(1500);
  report.email.screenshotTrust = await screenshot(emailPage, 'email-03-trust-or-next.png');
  report.email.finalUrl = emailPage.url();
}

await browser.close();

const outPath = path.join(OUT, 'signup-test-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log('REPORT_WRITTEN', outPath);
console.log(JSON.stringify(report, null, 2));
