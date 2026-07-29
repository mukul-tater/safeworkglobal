import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:5174';

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const logs = [];
page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', err => logs.push({ type: 'pageerror', text: String(err) }));

const net = [];
page.on('request', req => {
  const u = req.url();
  if (/firebase|identitytoolkit|recaptcha|googleapis|sendVerificationCode|verify/i.test(u)) {
    net.push({ kind: 'req', method: req.method(), url: u.slice(0, 200) });
  }
});
page.on('response', async res => {
  const u = res.url();
  if (/firebase|identitytoolkit|recaptcha|googleapis|sendVerificationCode/i.test(u)) {
    let body = '';
    try { body = (await res.text()).slice(0, 500); } catch {}
    net.push({ kind: 'res', status: res.status(), url: u.slice(0, 200), body });
  }
});

await page.goto(`${BASE}/worker/quick-signup`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);

// Check env / firebase config exposed?
const cfg = await page.evaluate(() => {
  const warn = document.body.innerText.includes('SMS OTP needs Firebase');
  const host = document.getElementById('worker-otp-recaptcha') || document.querySelector('[id*="recaptcha"]');
  return {
    warn,
    recaptchaHostId: host?.id || null,
    iframes: [...document.querySelectorAll('iframe')].map(f => ({ src: f.src?.slice(0,120), id: f.id, title: f.title })),
  };
});
console.log('CFG', JSON.stringify(cfg, null, 2));

await page.fill('#name', 'Test Worker Kailash');
await page.fill('#mobile', '9549230227');

const beforeClickNet = net.length;
await page.getByRole('button', { name: /Send SMS code/i }).click();

// Poll for 45s with detailed state
for (let i = 0; i < 45; i++) {
  await page.waitForTimeout(1000);
  const state = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /Send SMS|Create account|Verify/i.test(b.innerText));
    return {
      url: location.href,
      alerts: [...document.querySelectorAll('[role="alert"]')].map(e => e.innerText.trim()),
      toasts: [...document.querySelectorAll('[data-sonner-toast]')].map(e => e.innerText.trim()),
      otpPrompt: document.body.innerText.includes('Enter the 6-digit'),
      buttonText: btn?.innerText?.trim() || null,
      buttonDisabled: btn?.disabled ?? null,
      hasSpinner: !!document.querySelector('svg.animate-spin'),
      iframes: [...document.querySelectorAll('iframe')].map(f => ({ src: f.src?.slice(0,140), title: f.title })),
      visibleTextSample: document.body.innerText.slice(0, 800),
    };
  });
  if (i % 5 === 0 || state.alerts.length || state.toasts.length || state.otpPrompt || !state.hasSpinner) {
    console.log(`t=${i}s`, JSON.stringify({
      otpPrompt: state.otpPrompt,
      alerts: state.alerts,
      toasts: state.toasts,
      hasSpinner: state.hasSpinner,
      buttonText: state.buttonText,
      iframeCount: state.iframes.length,
      iframes: state.iframes,
    }, null, 2));
  }
  if (state.otpPrompt || state.alerts.length || (state.toasts.length && !state.hasSpinner)) {
    console.log('FINAL_STATE', JSON.stringify(state, null, 2));
    break;
  }
  if (i === 44) {
    console.log('TIMEOUT_STATE', JSON.stringify(state, null, 2));
  }
}

await page.screenshot({ path: path.join(__dirname, 'sms-04-debug.png'), fullPage: true });

const relevantLogs = logs.filter(l =>
  l.type === 'error' || l.type === 'pageerror' || /firebase|recaptcha|otp|auth|error|fail/i.test(l.text)
);
console.log('NET_COUNT', net.length - beforeClickNet);
console.log('NET', JSON.stringify(net.slice(beforeClickNet), null, 2));
console.log('LOGS', JSON.stringify(relevantLogs.slice(0, 40), null, 2));

fs.writeFileSync(path.join(__dirname, 'sms-debug-report.json'), JSON.stringify({ cfg, net, relevantLogs, allLogs: logs.slice(-50) }, null, 2));
await browser.close();
console.log('DONE');
