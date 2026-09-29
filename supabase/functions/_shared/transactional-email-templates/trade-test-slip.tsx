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

interface TradeTestSlipProps {
  workerName?: string
  cancelled?: boolean
  cancelReason?: string
  reference?: string
  appliedFor?: string
  testToday?: string
  intro?: string
  testName?: string
  jobPlace?: string
  experience?: string
  appointmentDate?: string
  reportingWindow?: string
  centreName?: string
  address?: string
  contact?: string
  mapsUrl?: string
  instructions?: string
  journeyUrl?: string
  status?: string
}

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Text style={line}>
      <strong>{label}: </strong>
      {value}
    </Text>
  ) : null

const TradeTestSlipEmail = ({
  workerName = 'there',
  cancelled = false,
  cancelReason = '',
  reference = '',
  appliedFor = '',
  testToday = '',
  intro = '',
  testName = 'Test 3 — Physical trade test',
  jobPlace = '',
  experience = '',
  appointmentDate = '',
  reportingWindow = '',
  centreName = '',
  address = '',
  contact = '',
  mapsUrl = '',
  instructions = '',
  journeyUrl = 'https://safeworkglobal.com/worker/journey',
  status = 'Booked',
}: TradeTestSlipProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
    </Head>
    <Preview>
      {cancelled ? `Trade test slip ${reference} cancelled` : `Trade test slip ${reference}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>SafeWork Global</Heading>
        <Text style={meta}>Hi {workerName},</Text>
        <Heading as="h2" style={h2}>
          {cancelled ? 'Trade test slip cancelled' : 'Your trade test slip'}
        </Heading>
        {cancelled ? (
          <Section style={messageBox}>
            <Text style={messageText}>
              Booking {reference} is cancelled. {cancelReason || 'SafeWork will tell you the next step.'}
            </Text>
          </Section>
        ) : (
          <Section style={messageBox}>
            <Text style={referenceStyle}>{reference}</Text>
            <Text style={messageText}>{appliedFor}</Text>
            <Text style={messageText}>{testToday}</Text>
            <Text style={messageText}>{intro}</Text>
            <Text style={meta}>Status: {status}. Show this email or the slip in your portal at the centre.</Text>
          </Section>
        )}
        {!cancelled && (
          <>
            <Row label="Test" value={testName} />
            <Row label="Job location" value={jobPlace} />
            <Row label="Experience asked" value={experience} />
            <Row label="Date" value={appointmentDate} />
            <Row label="Reporting window" value={reportingWindow} />
            <Row label="Centre" value={centreName} />
            <Row label="Address" value={address} />
            <Row label="Centre contact" value={contact} />
            <Row label="What to bring" value={`This slip and your original Aadhaar card. ${instructions}`.trim()} />
            {mapsUrl ? (
              <Text style={line}>
                <a href={mapsUrl}>Open map</a>
              </Text>
            ) : null}
          </>
        )}
        <Button href={journeyUrl} style={button}>
          Open slip in your portal
        </Button>
        <Hr style={hr} />
        <Text style={footer}>SafeWork Global — Indian skills. Global opportunities.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TradeTestSlipEmail,
  subject: (data: Record<string, any>) =>
    data?.cancelled
      ? `Trade test slip ${data?.reference || ''} cancelled`
      : `Trade test slip ${data?.reference || ''} — ${data?.testToday || 'physical trade test'}`,
  displayName: 'Trade test slip',
  previewData: {
    workerName: 'Ramesh',
    reference: 'TT-10000',
    appliedFor: 'Applied for: Welder',
    testToday: 'Test today: Welder physical trade test',
    intro: 'This person applied for a Welder job and is here to give the Welder physical trade test.',
    appointmentDate: '2026-10-02',
    reportingWindow: '9:00 AM – 10:00 AM',
    centreName: 'Trade Test Center — Jaipur',
    address: 'Jaipur, Rajasthan',
    status: 'Booked',
    journeyUrl: 'https://safeworkglobal.com/worker/journey',
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
const referenceStyle = { color: '#1e2a4a', fontSize: '28px', fontWeight: 700, letterSpacing: '1px', margin: '0 0 8px', fontFamily }
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
