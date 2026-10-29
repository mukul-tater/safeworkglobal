import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { ONBOARDING_ADMIN_EMAIL } from '../onboardingEmail.ts'

interface Props { name?: string; role?: string; email?: string; phone?: string; createdAt?: string }
const Email = ({ name, role = 'worker', email, phone, createdAt }: Props) => (
  <Html lang="en" dir="ltr"><Head><meta charSet="UTF-8" /></Head>
    <Preview>A new {role} account has joined SafeWork Global.</Preview>
    <Body style={main}><Container style={container}>
      <Text style={brand}>SafeWorkGlobal</Text>
      <Heading style={heading}>New {role} account</Heading>
      <Text style={text}>Name: {name || 'Not provided'}<br />Account type: {role}<br />Email: {email || 'Phone-only account'}<br />Phone: {phone || 'Not provided'}<br />Registered: {createdAt || 'Not provided'}</Text>
      <Button href="https://safeworkglobal.com/admin/users" style={button}>View users</Button>
    </Container></Body>
  </Html>
)
export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => `New ${String(data.role || 'user')} registered — SafeWork Global`,
  displayName: 'New account admin notification',
  to: ONBOARDING_ADMIN_EMAIL,
  previewData: { name: 'New member', role: 'worker' },
} satisfies TemplateEntry
const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '520px' }
const brand = { color: '#2b4de8', fontSize: '16px', fontWeight: 700 }
const heading = { color: '#172033', fontSize: '24px' }
const text = { color: '#4b5563', fontSize: '15px', lineHeight: '1.7' }
const button = { backgroundColor: '#2b4de8', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', fontSize: '15px' }