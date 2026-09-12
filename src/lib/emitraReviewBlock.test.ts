import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emitraReviewBlockMessage } from './emitraReviewBlock.ts';

test('emitraReviewBlockMessage: organic and approved workers can use the portal', () => {
  assert.equal(emitraReviewBlockMessage('organic', 'not_required'), null);
  assert.equal(emitraReviewBlockMessage('emitra', 'approved'), null);
  assert.equal(emitraReviewBlockMessage('emitra', 'pending'), null);
  assert.equal(emitraReviewBlockMessage('partner', 'pending'), null);
});

test('emitraReviewBlockMessage: rejected emitra workers are blocked', () => {
  const msg = emitraReviewBlockMessage('emitra', 'rejected');
  assert.ok(msg);
  assert.match(msg, /not approved/i);
});
