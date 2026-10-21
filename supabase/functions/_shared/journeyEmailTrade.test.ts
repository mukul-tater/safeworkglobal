import { test } from 'node:test'
import assert from 'node:assert/strict'
import { journeyEmailTrade } from './journeyEmailTrade.ts'

test('General Production Helper stays the email trade even when the quiz category is Helper', () => {
  assert.equal(journeyEmailTrade('General Production Helper', 'Helper'), 'General Production Helper')
})

test('missing job title falls back to the stored skill', () => {
  assert.equal(journeyEmailTrade('  ', ' Helper '), 'Helper')
})