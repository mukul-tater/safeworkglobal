/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface JourneyStepClearedProps {
  workerName?: string
  title?: string
  message?: string
  journeyUrl?: string
  isTerminal?: boolean
}

const JourneyStepClearedEmail = ({
  workerName = 'there',
  title = 'Journey step cleared',
  message = 'You cleared a step. Please continue your journey.',
  journeyUrl = 'https://safeworkglobal.com/worker/journey',
  isTerminal = false,
}: JourneyStepClearedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>SafeWork Global</Heading>
        <Text style={meta}>Hi {workerName},</Text>
        <Heading as="h2" style={h2}>{title}</Heading>
        <Section style={messageBox}>
          <Text style={messageText}>{message}</Text>
        </Section>
        {!isTerminal ? (
          <Text style={meta}>
            Please continue to the next step to complete the journey and get a job.
            / कृपया अगला कदम पूरा करें ताकि यात्रा पूरी हो और नौकरी मिल सके।
          </Text>
        ) : (
          <Text style={meta}>
            You are GCC ready. Browse jobs when you are ready.
            / आप GCC रेडी हैं। जब तैयार हों, नौकरियाँ देखें।
          </Text>
        )}
        <Button href={journeyUrl} style={button}>
          Continue your journey
        </Button>
        <Hr style={hr} />
        <Text style={footer}>SafeWork Global — Indian skills. Global opportunities.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JourneyStepClearedEmail,
  subject: (data: Record<string, any>) =>
    String(data?.title || 'Journey step cleared — continue on SafeWork Global'),
  displayName: 'Journey step cleared',
  previewData: {
    workerName: 'Ramesh',
    title: 'Test 1 cleared / टेस्ट 1 पूरा',
    message:
      'You cleared Test 1 — Basic trade knowledge. You can now proceed to Skill proof upload. / आपने टेस्ट 1 पास कर लिया है। अब स्किल प्रूफ अपलोड पर जाएँ।',
    journeyUrl: 'https://safeworkglobal.com/worker/journey',
    isTerminal: false,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '640px' }
const h1 = { color: '#1e2a4a', fontSize: '18px', margin: '0 0 8px' }
const h2 = { color: '#1e2a4a', fontSize: '20px', margin: '12px 0' }
const meta = { color: '#4b5563', fontSize: '14px', lineHeight: '1.6', margin: '8px 0' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const messageBox = { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const messageText = { color: '#1f2937', fontSize: '14px', lineHeight: '1.6', margin: '0' }
const button = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '12px 20px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  marginTop: '12px',
}
const footer = { color: '#9ca3af', fontSize: '12px', marginTop: '8px' }
