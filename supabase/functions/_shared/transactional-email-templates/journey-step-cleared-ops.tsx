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
  clearedStep?: string
  nextStep?: string
  isTerminal?: boolean
  adminUrl?: string
}

function present(value?: string): string {
  const trimmed = (value || '').trim()
  if (!trimmed || trimmed === 'not specified' || trimmed === 'not provided') return ''
  return trimmed
}

const JourneyStepClearedOpsEmail = ({
  workerName = 'Unknown worker',
  workerEmail = '',
  workerPhone = '',
  trade = '',
  location = '',
  clearedStep = 'a journey step',
  nextStep = 'the next step',
  isTerminal = false,
  adminUrl = 'https://safeworkglobal.com/admin/journey-ops',
}: JourneyStepClearedOpsProps) => {
  const emailLine = present(workerEmail)
  const phoneLine = present(workerPhone)
  const tradeLine = present(trade)
  const locationLine = present(location)
  const stepName = clearedStep.trim() || 'a journey step'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${workerName} completed ${stepName}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{stepName} completed</Heading>
          <Text style={lead}>
            {workerName} has completed {stepName}.
            {isTerminal
              ? ' They are now GCC ready.'
              : ` Next step is ${nextStep}.`}
          </Text>
          <Section>
            <Text style={meta}><strong>Worker:</strong> {workerName}</Text>
            {emailLine ? <Text style={meta}><strong>Email:</strong> {emailLine}</Text> : null}
            {phoneLine ? <Text style={meta}><strong>Mobile:</strong> {phoneLine}</Text> : null}
            {tradeLine ? <Text style={meta}><strong>Trade:</strong> {tradeLine}</Text> : null}
            {locationLine ? <Text style={meta}><strong>Location:</strong> {locationLine}</Text> : null}
            <Text style={meta}><strong>Cleared:</strong> {stepName}</Text>
            <Text style={meta}>
              <strong>{isTerminal ? 'Status:' : 'Next step:'}</strong>{' '}
              {isTerminal ? 'GCC ready' : nextStep}
            </Text>
          </Section>
          <Button href={adminUrl} style={button}>
            Open in admin
          </Button>
          <Hr style={hr} />
          <Text style={footer}>SafeWork Global</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: JourneyStepClearedOpsEmail,
  subject: (data: Record<string, any>) =>
    `${data?.clearedStep || 'Journey step'} completed — ${data?.workerName || 'Worker'}`,
  displayName: 'Journey step cleared (ops)',
  to: 'mukultater@safeworkglobal.com',
  previewData: {
    workerName: 'Ramesh Kumar',
    workerEmail: 'ramesh@example.com',
    workerPhone: '9876543210',
    trade: 'Welder',
    location: 'Jaipur, Rajasthan',
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
