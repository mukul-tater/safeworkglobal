import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  workerAuthEmailFromIdentifier,
  workerAuthEmailFromMobile,
} from './workerAuthEmail.ts';

test('workerAuthEmailFromIdentifier: email is lowercased; mobile falls back to synthetic', () => {
  assert.equal(workerAuthEmailFromIdentifier('  Worker@Example.COM '), 'worker@example.com');
  assert.equal(
    workerAuthEmailFromIdentifier('9876543210'),
    workerAuthEmailFromMobile('9876543210'),
  );
  assert.equal(workerAuthEmailFromIdentifier(''), null);
});

test('synthetic fallback is only for legacy mobile-only accounts', () => {
  assert.equal(
    workerAuthEmailFromMobile('+91 98765 43210'),
    'm9876543210@workers.safeworkglobal.app',
  );
});
