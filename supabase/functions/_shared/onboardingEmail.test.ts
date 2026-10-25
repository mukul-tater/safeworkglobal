import { expect, test } from 'bun:test'
import { isNewOnboardingAccount, onboardingRole, onboardingUserEmail, ONBOARDING_ADMIN_EMAIL } from './onboardingEmail'

test('onboarding notifications go to the requested admin inbox', () => {
  expect(ONBOARDING_ADMIN_EMAIL).toBe('mukul@safeworkglobal.com')
})
test('welcome supports worker employer and partner accounts only', () => {
  expect(['worker', 'employer', 'partner'].map(onboardingRole)).toEqual(['worker', 'employer', 'partner'])
  expect(onboardingRole('admin')).toBeNull()
})
test('existing accounts do not receive retroactive onboarding mail', () => {
  expect(isNewOnboardingAccount('2026-10-24T23:59:59Z')).toBe(false)
  expect(isNewOnboardingAccount('2026-10-25T06:12:00Z')).toBe(true)
  expect(isNewOnboardingAccount('invalid')).toBe(false)
})
test('synthetic phone accounts never receive email', () => {
  expect(onboardingUserEmail('123@workers.safeworkglobal.app')).toBeNull()
  expect(onboardingUserEmail('123@partners.safeworkglobal.app')).toBeNull()
  expect(onboardingUserEmail('new@example.com')).toBe('new@example.com')
})