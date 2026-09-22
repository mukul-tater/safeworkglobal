/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface SignupEmailOtpProps {
  code?: string
}

const SignupEmailOtp = ({ code = '123456' }: SignupEmailOtpProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your SafeWork Global verification code is {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verify your email</Heading>
        <Text style={bodyText}>
          Use this code to finish creating your SafeWork Global account. It expires in 10 minutes.
        </Text>
        <Text style={codeText}>{code}</Text>
        <Text style={footer}>
          If you did not request this, you can ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SignupEmailOtp,
  subject: 'Your SafeWork Global verification code',
  displayName: 'Signup email OTP',
  previewData: { code: '123456' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '480px' }
const h1 = { color: '#1e2a4a', fontSize: '20px', margin: '0 0 12px' }
const bodyText = { color: '#4b5563', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.5' }
const codeText = {
  color: '#1e2a4a',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '6px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}
const footer = { color: '#9ca3af', fontSize: '12px', margin: '0' }
