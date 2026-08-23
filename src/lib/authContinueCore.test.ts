import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_CONTINUE_MESSAGES,
  buildAuthContinueRequest,
  mapAuthContinuePayload,
  parseAuthIdentifier,
  portalAuthPath,
} from './authContinueCore.ts';

test('parseAuthIdentifier: empty and whitespace', () => {
  assert.equal(parseAuthIdentifier('').ok, false);
  assert.equal(parseAuthIdentifier('   ').ok, false);
  assert.equal(parseAuthIdentifier('').ok === false && parseAuthIdentifier('').error, AUTH_CONTINUE_MESSAGES.empty);
});

test('parseAuthIdentifier: email trim and lowercase', () => {
  const parsed = parseAuthIdentifier('  User@Example.COM  ');
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.method, 'email');
    assert.equal(parsed.email, 'user@example.com');
  }
});

test('parseAuthIdentifier: invalid email', () => {
  const parsed = parseAuthIdentifier('not-an-email');
  assert.equal(parsed.ok, false);
});

test('parseAuthIdentifier: invalid email with @', () => {
  const parsed = parseAuthIdentifier('user@');
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.equal(parsed.error, AUTH_CONTINUE_MESSAGES.invalid_email);
});

test('parseAuthIdentifier: Indian mobile and country-code variants', () => {
  for (const raw of ['9876543210', '+91 9876543210', '91-98765-43210', '  9876543210  ']) {
    const parsed = parseAuthIdentifier(raw);
    assert.equal(parsed.ok, true, raw);
    if (parsed.ok) {
      assert.equal(parsed.method, 'mobile');
      assert.equal(parsed.mobile, '9876543210');
    }
  }
});

test('parseAuthIdentifier: invalid mobile', () => {
  assert.equal(parseAuthIdentifier('12345').ok, false);
  assert.equal(parseAuthIdentifier('5876543210').ok, false);
});

test('buildAuthContinueRequest: email and mobile', () => {
  const emailReq = buildAuthContinueRequest('worker', 'email', '  A@B.COM ', '');
  assert.ok('request' in emailReq);
  if ('request' in emailReq) {
    assert.deepEqual(emailReq.request, { role: 'worker', email: 'a@b.com' });
  }

  const mobileReq = buildAuthContinueRequest('partner', 'mobile', '', '+919876543210');
  assert.ok('request' in mobileReq);
  if ('request' in mobileReq) {
    assert.deepEqual(mobileReq.request, { role: 'partner', mobile: '9876543210' });
  }
});

test('mapAuthContinuePayload: LOGIN / SIGNUP / conflict / wrong portal', () => {
  assert.deepEqual(mapAuthContinuePayload({ ok: true, exists: true, next_step: 'LOGIN' }).nextStep, 'LOGIN');
  assert.equal(mapAuthContinuePayload({ ok: true, exists: false, next_step: 'SIGNUP' }).exists, false);

  const conflict = mapAuthContinuePayload({ ok: true, exists: true, next_step: 'ACCOUNT_CONFLICT' });
  assert.equal(conflict.nextStep, 'ACCOUNT_CONFLICT');
  assert.equal(conflict.error, AUTH_CONTINUE_MESSAGES.conflict);

  const wrong = mapAuthContinuePayload({
    ok: true,
    exists: true,
    next_step: 'WRONG_PORTAL',
    portal: 'employer',
  });
  assert.equal(wrong.nextStep, 'WRONG_PORTAL');
  assert.equal(wrong.portal, 'employer');
  assert.match(wrong.error || '', /employer portal/);
});

test('mapAuthContinuePayload: rate limit and invalid payload', () => {
  const limited = mapAuthContinuePayload({ ok: false, exists: false, next_step: 'RATE_LIMITED' });
  assert.equal(limited.nextStep, 'RATE_LIMITED');
  assert.equal(limited.ok, false);

  const empty = mapAuthContinuePayload({ ok: false, next_step: 'ERROR', error: 'empty' });
  assert.equal(empty.error, AUTH_CONTINUE_MESSAGES.empty);

  const invalid = mapAuthContinuePayload(null);
  assert.equal(invalid.nextStep, 'ERROR');
});

test('portalAuthPath', () => {
  assert.equal(portalAuthPath('worker'), '/worker/login');
  assert.equal(portalAuthPath('employer'), '/employer/login');
  assert.equal(portalAuthPath('partner'), '/partner/login');
});
