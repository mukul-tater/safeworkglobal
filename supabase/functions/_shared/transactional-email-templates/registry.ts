import type { ComponentType } from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome.tsx'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
import { template as contactEnquiryTemplate } from './contact-enquiry.tsx'
import { template as journeyStepClearedTemplate } from './journey-step-cleared.tsx'
import { template as journeyStepClearedOpsTemplate } from './journey-step-cleared-ops.tsx'
import { template as signupEmailOtpTemplate } from './signup-email-otp.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-enquiry': contactEnquiryTemplate,
  'journey-step-cleared': journeyStepClearedTemplate,
  'journey-step-cleared-ops': journeyStepClearedOpsTemplate,
  'signup-email-otp': signupEmailOtpTemplate,
}
