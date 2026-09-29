import { test } from 'node:test';
import assert from 'node:assert/strict';
import { devPortalAuthEmail, devStoredPhone } from './devPortalAuthEmail.ts';

test('one typed mobile maps to three different accounts', () => {
  const mobile = '9876543210';
  const emails = [
    devPortalAuthEmail('worker', mobile),
    devPortalAuthEmail('emitra', mobile),
    devPortalAuthEmail('ssvn', mobile),
  ];
  const phones = [
    devStoredPhone('worker', mobile),
    devStoredPhone('emitra', mobile),
    devStoredPhone('ssvn', mobile),
  ];
  assert.equal(emails[0], 'm9876543210@workers.safeworkglobal.app');
  assert.equal(emails[1], 'dev.emitra.9876543210@partners.safeworkglobal.app');
  assert.equal(emails[2], 'dev.ssvn.9876543210@partners.safeworkglobal.app');
  assert.equal(phones[0], '9876543210');
  assert.equal(phones[1], '6876543210');
  assert.equal(phones[2], '7876543210');
  assert.equal(new Set(emails).size, 3);
  assert.equal(new Set(phones).size, 3);
  assert.equal(emails[1].startsWith('emitra9876543210@'), false);
  assert.equal(emails[2].startsWith('ssvn9876543210@'), false);
});
