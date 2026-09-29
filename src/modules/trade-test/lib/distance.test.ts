import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDistanceKm, haversineKm } from './distance.ts';
import { appliedForLine, centreOffersTrade, slipIntroLine, testTodayLine } from './slipCopy.ts';

test('haversineKm is about 18 km between two nearby points', () => {
  const km = haversineKm(
    { latitude: 26.9124, longitude: 75.7873 },
    { latitude: 26.85, longitude: 75.8 },
  );
  assert.ok(km > 5 && km < 15);
});

test('formatDistanceKm rounds and hides missing values', () => {
  assert.equal(formatDistanceKm(18.2), '18 km');
  assert.equal(formatDistanceKm(0.4), 'under 1 km');
  assert.equal(formatDistanceKm(null), null);
});

test('a welder centre is not offered for a carpenter', () => {
  assert.equal(centreOffersTrade(['Welder', 'MIG Welder'], 'Welder'), true);
  assert.equal(centreOffersTrade(['Carpenter'], 'Welder'), false);
  assert.equal(centreOffersTrade([], 'Welder'), false);
});

test('slip names the applied trade and the test', () => {
  assert.equal(appliedForLine('Welder'), 'Applied for: Welder');
  assert.equal(testTodayLine('Welder'), 'Test today: Welder physical trade test');
  assert.match(slipIntroLine('Welder'), /Welder job/);
  assert.match(slipIntroLine('Welder'), /Welder physical trade test/);
  assert.equal(slipIntroLine('Welder').includes('Carpenter'), false);
});
