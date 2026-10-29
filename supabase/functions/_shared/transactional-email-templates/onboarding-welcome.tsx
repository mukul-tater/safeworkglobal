import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; role?: string; dashboardUrl?: string }
const Email = ({ name, role = 'worker', dashboardUrl = 'https://safeworkglobal.com' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head><meta charSet="UTF-8" /></Head>
    <Preview>Your SafeWork Global {role} account has been created.</Preview>
    <Body style={main}><Container style={container}>
      <Text style={brand}>SafeWorkGlobal</Text>
      <Heading style={heading}>Welcome to SafeWork Global</Heading>
      <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
      <Text style={text}>Your {role} account has been created successfully.</Text>
      <Text style={text}>{role === 'worker' ? 'Continue your worker journey and complete the required details in your account.' : role === 'employer' ? 'Sign in to complete your business details and continue with your hiring requirements.' : 'Sign in to complete your partner details and continue your registration.'}</Text>
      <Button href={dashboardUrl} style={button}>Open my account</Button>
      <Text style={footer}>If you did not create this account, contact us at https://safeworkglobal.com/contact.</Text>
    </Container></Body>
  </Html>
)
export const template = {
  component: Email,
  subject: 'Welcome to SafeWork Global',
  displayName: 'New account welcome',
  previewData: { name: 'New member', role: 'worker', dashboardUrl: 'https://safeworkglobal.com/worker/journey' },
} satisfies TemplateEntry
const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '520px' }
const brand = { color: '#2b4de8', fontSize: '16px', fontWeight: 700 }
const heading = { color: '#172033', fontSize: '24px' }
const text = { color: '#4b5563', fontSize: '15px', lineHeight: '1.6' }
const button = { backgroundColor: '#2b4de8', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', fontSize: '15px' }
const footer = { color: '#6b7280', fontSize: '12px', marginTop: '28px' }