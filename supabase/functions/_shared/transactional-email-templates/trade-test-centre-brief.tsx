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

interface TradeTestCentreBriefProps {
  centreName?: string
  cancelled?: boolean
  cancelReason?: string
  workerName?: string
  workerPhone?: string
  workerEmail?: string
  trade?: string
  yearsExperience?: string
  workerLocation?: string
  aadhaarEnding?: string
  appliedFor?: string
  jobPlace?: string
  experienceAsked?: string
  reference?: string
  appointmentDate?: string
  reportingWindow?: string
  portalUrl?: string
}

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Text style={line}>
      <strong>{label}: </strong>
      {value}
    </Text>
  ) : null

const TradeTestCentreBriefEmail = ({
  centreName = 'Trade test centre',
  cancelled = false,
  cancelReason = '',
  workerName = 'A worker',
  workerPhone = '',
  workerEmail = '',
  trade = '',
  yearsExperience = '',
  workerLocation = '',
  aadhaarEnding = '',
  appliedFor = '',
  jobPlace = '',
  experienceAsked = '',
  reference = '',
  appointmentDate = '',
  reportingWindow = '',
  portalUrl = 'https://safeworkglobal.com/partner/ssvn/inbox',
}: TradeTestCentreBriefProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
    </Head>
    <Preview>
      {cancelled
        ? `${workerName} is no longer coming for ${reference || 'the trade test'}`
        : `${workerName} is coming for a ${trade || 'trade'} test`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>SafeWork Global</Heading>
        <Text style={meta}>Hello {centreName},</Text>
        <Heading as="h2" style={h2}>
          {cancelled ? 'This worker is no longer coming' : 'A worker is coming for a trade test'}
        </Heading>
        <Section style={messageBox}>
          <Text style={referenceStyle}>{reference || 'Trade test'}</Text>
          <Text style={messageText}>
            {cancelled
              ? `${workerName} will not attend. ${cancelReason || 'The booking was cancelled.'}`
              : `${workerName} is booked to give the ${trade || 'trade'} physical trade test at your centre.`}
          </Text>
        </Section>
        <Row label="Worker" value={workerName} />
        <Row label="Mobile" value={workerPhone} />
        <Row label="Email" value={workerEmail} />
        <Row label="Trade" value={trade} />
        <Row label="Experience" value={yearsExperience} />
        <Row label="Worker location" value={workerLocation} />
        <Row label="Aadhaar ending" value={aadhaarEnding} />
        <Row label="Applied for" value={appliedFor} />
        <Row label="Job location" value={jobPlace} />
        <Row label="Experience asked" value={experienceAsked} />
        {!cancelled && <Row label="Date" value={appointmentDate} />}
        {!cancelled && <Row label="Reporting window" value={reportingWindow} />}
        <Button href={portalUrl} style={button}>
          Open this worker in your portal
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          SafeWork Global — sent to the trade test centre when a worker is booked for a physical test.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TradeTestCentreBriefEmail,
  subject: (data: Record<string, any>) =>
    data?.cancelled
      ? `Trade test cancelled ${data?.reference || ''} — ${data?.workerName || 'worker'}`
      : `Worker coming for trade test ${data?.reference || ''} — ${data?.workerName || 'worker'}`,
  displayName: 'Trade test centre worker brief',
  previewData: {
    centreName: 'Dev Trade Test Centre',
    workerName: 'Ramesh Kumar',
    workerPhone: '+91 9876543210',
    workerEmail: 'ramesh@example.com',
    trade: 'Welder',
    yearsExperience: '6 years',
    workerLocation: 'Jaipur, Rajasthan',
    aadhaarEnding: '9012',
    appliedFor: 'Welder',
    jobPlace: 'Dubai, UAE',
    experienceAsked: '3–5 years',
    reference: 'TT-10000',
    appointmentDate: '2026-10-02',
    reportingWindow: '9:00 AM – 10:00 AM',
    portalUrl: 'https://safeworkglobal.com/partner/ssvn/inbox',
  },
} satisfies TemplateEntry

const fontFamily = "'Nirmala UI', 'Noto Sans Devanagari', Mangal, sans-serif"
const main = { backgroundColor: '#ffffff', fontFamily }
const container = { padding: '24px', maxWidth: '640px' }
const h1 = { color: '#1e2a4a', fontSize: '18px', margin: '0 0 8px', fontFamily, fontWeight: 700 }
const h2 = { color: '#1e2a4a', fontSize: '20px', margin: '12px 0', fontFamily, fontWeight: 700 }
const meta = { color: '#4b5563', fontSize: '14px', lineHeight: '1.6', margin: '8px 0', fontFamily }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const messageBox = { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const messageText = { color: '#1f2937', fontSize: '14px', lineHeight: '1.6', margin: '4px 0', fontFamily }
const referenceStyle = { color: '#1e2a4a', fontSize: '22px', fontWeight: 700, letterSpacing: '1px', margin: '0 0 8px', fontFamily }
const line = { color: '#1f2937', fontSize: '14px', lineHeight: '1.6', margin: '4px 0', fontFamily }
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
  fontFamily,
}
const footer = { color: '#9ca3af', fontSize: '12px', marginTop: '8px', fontFamily }
