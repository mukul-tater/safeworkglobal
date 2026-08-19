/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
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

interface ContactEnquiryProps {
  name?: string
  email?: string
  mobile?: string
  role?: string
  subject?: string
  message?: string
}

const ContactEnquiryEmail = ({
  name = 'Unknown',
  email = 'not provided',
  mobile = 'not provided',
  role = 'not specified',
  subject = 'New enquiry',
  message = '',
}: ContactEnquiryProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New Contact Us enquiry from ${name}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Contact Us enquiry</Heading>
        <Text style={meta}><strong>Name:</strong> {name}</Text>
        <Text style={meta}><strong>I am:</strong> {role}</Text>
        <Text style={meta}><strong>Mobile:</strong> {mobile}</Text>
        <Text style={meta}><strong>Email:</strong> {email}</Text>
        <Text style={meta}><strong>Subject:</strong> {subject}</Text>
        <Hr style={hr} />
        <Section style={messageBox}>
          <Text style={messageText}>{message}</Text>
        </Section>
        <Text style={footer}>Sent from the SafeWork Global Contact Us form.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactEnquiryEmail,
  subject: (data: Record<string, any>) =>
    `Contact enquiry: ${data?.subject || 'New enquiry'}`,
  displayName: 'Contact Us enquiry',
  to: 'mukultater@safeworkglobal.com',
  previewData: {
    name: 'Ramesh Kumar',
    email: 'ramesh@example.com',
    mobile: '9876543210',
    role: 'Worker',
    subject: 'Question about GCC jobs',
    message: 'I would like to know how to apply for welding jobs in UAE.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '640px' }
const h1 = { color: '#1e2a4a', fontSize: '20px', margin: '0 0 16px' }
const meta = { color: '#4b5563', fontSize: '14px', margin: '4px 0' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const messageBox = { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px' }
const messageText = { color: '#1f2937', fontSize: '14px', whiteSpace: 'pre-wrap' as const, margin: '0' }
const footer = { color: '#9ca3af', fontSize: '12px', marginTop: '24px' }
