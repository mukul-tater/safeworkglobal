import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkerOtpLoginPayload } from './workerOtpLoginCore.ts';

test('parseWorkerOtpLoginPayload: accepts session tokens', () => {
  const parsed = parseWorkerOtpLoginPayload(
    { access_token: 'at', refresh_token: 'rt' },
    null,
  );
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.session.access_token, 'at');
    assert.equal(parsed.session.refresh_token, 'rt');
  }
});

test('parseWorkerOtpLoginPayload: prefers function error body', () => {
  const parsed = parseWorkerOtpLoginPayload(
    { error: 'No worker account found for this mobile number.' },
    { message: 'Edge Function returned a non-2xx status code' },
  );
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.equal(parsed.error, 'No worker account found for this mobile number.');
  }
});

test('parseWorkerOtpLoginPayload: maps unreachable function errors', () => {
  const parsed = parseWorkerOtpLoginPayload(null, { message: 'Failed to send a request to the Edge Function' });
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.equal(parsed.error, 'Sign-in service is updating. Wait a minute and try again.');
  }
});
