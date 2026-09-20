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

interface JourneyStepClearedOpsProps {
  workerName?: string
  workerEmail?: string
  workerPhone?: string
  trade?: string
  location?: string
  jobTitle?: string
  clearedStep?: string
  nextStep?: string
  isTerminal?: boolean
  adminUrl?: string
}

const JourneyStepClearedOpsEmail = ({
  workerName = 'Unknown worker',
  workerEmail = 'not provided',
  workerPhone = 'not provided',
  trade = 'not specified',
  location = 'not specified',
  jobTitle = 'not specified',
  clearedStep = 'a journey step',
  nextStep = 'the next step',
  isTerminal = false,
  adminUrl = 'https://safeworkglobal.com/admin/journey-ops',
}: JourneyStepClearedOpsProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${workerName} completed ${clearedStep}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Worker journey step completed</Heading>
        <Text style={lead}>
          {workerName} has completed {clearedStep}.
          {isTerminal
            ? ' They are now GCC ready.'
            : ` They should now proceed to ${nextStep}.`}
        </Text>
        <Section>
          <Text style={meta}><strong>Worker:</strong> {workerName}</Text>
          <Text style={meta}><strong>Email:</strong> {workerEmail}</Text>
          <Text style={meta}><strong>Mobile:</strong> {workerPhone}</Text>
          <Text style={meta}><strong>Trade:</strong> {trade}</Text>
          <Text style={meta}><strong>Location:</strong> {location}</Text>
          <Text style={meta}><strong>Journey job:</strong> {jobTitle}</Text>
          <Text style={meta}><strong>Cleared:</strong> {clearedStep}</Text>
          <Text style={meta}>
            <strong>{isTerminal ? 'Status:' : 'Next step:'}</strong>{' '}
            {isTerminal ? 'GCC ready' : nextStep}
          </Text>
        </Section>
        <Button href={adminUrl} style={button}>
          Open Journey Ops
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          SafeWork Global internal notification — sent when a worker clears a journey step.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JourneyStepClearedOpsEmail,
  subject: (data: Record<string, any>) =>
    `Worker step cleared: ${data?.workerName || 'Worker'} — ${data?.clearedStep || 'journey step'}`,
  displayName: 'Journey step cleared (ops)',
  to: 'mukultater@safeworkglobal.com',
  previewData: {
    workerName: 'Ramesh Kumar',
    workerEmail: 'ramesh@example.com',
    workerPhone: '9876543210',
    trade: 'Welder',
    location: 'Jaipur, Rajasthan',
    jobTitle: 'GCC Welder',
    clearedStep: 'Test 1 — Basic trade knowledge',
    nextStep: 'Skill proof upload',
    isTerminal: false,
    adminUrl: 'https://safeworkglobal.com/admin/journey-ops',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '640px' }
const h1 = { color: '#1e2a4a', fontSize: '20px', margin: '0 0 12px' }
const lead = { color: '#1f2937', fontSize: '15px', lineHeight: '1.6', margin: '0 0 16px' }
const meta = { color: '#4b5563', fontSize: '14px', margin: '4px 0' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const button = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '12px 20px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  marginTop: '16px',
}
const footer = { color: '#9ca3af', fontSize: '12px', marginTop: '8px' }
