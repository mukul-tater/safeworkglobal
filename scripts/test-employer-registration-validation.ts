import { isValidUaeMobile, toUaeE164, validateSchema } from '../src/lib/validations/common';
import {
  employerCompanySchema,
  employerContactSchema,
  employerDeclarationsSchema,
  employerPartnershipSchema,
  employerWorkforceSchema,
  manpowerRequirementSchema,
} from '../src/lib/validations/employerRegistration';
import { skillsForTrade } from '../src/lib/employerTradeSkills';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
  console.log(`ok  ${message}`);
}

function failContains(errors: Record<string, string>, key: string, snippet: string) {
  const msg = errors[key] || Object.values(errors).join(' | ');
  assert(Boolean(msg) && msg.toLowerCase().includes(snippet.toLowerCase()), `${key} mentions "${snippet}" (got: ${msg})`);
}

// Empty company submission
{
  const result = validateSchema(employerCompanySchema, {
    companyLegalName: '',
    tradeName: '',
    companyType: '',
    businessActivity: '',
    emirate: '',
    website: '',
    linkedin: '',
    tradeLicencePath: '',
    companyProfilePath: '',
  });
  assert(!result.success, 'empty company submission is rejected');
  failContains(result.errors, 'companyLegalName', 'required');
  failContains(result.errors, 'tradeLicencePath', 'required');
}

// Invalid email
{
  const result = validateSchema(employerContactSchema, {
    fullName: 'Ahmed Khan',
    designation: 'HR Manager',
    uaeMobile: '501234567',
    whatsapp: '',
    businessEmail: 'not-an-email',
    preferredCommunication: 'Email',
    additionalContact: '',
  });
  assert(!result.success, 'invalid email is rejected');
  failContains(result.errors, 'businessEmail', 'email');
}

// Invalid UAE phone
{
  assert(!isValidUaeMobile('9876543210'), 'Indian mobile is not a valid UAE mobile');
  assert(!isValidUaeMobile('50123'), 'short UAE number is invalid');
  assert(isValidUaeMobile('501234567'), '9-digit UAE mobile is valid');
  assert(isValidUaeMobile('+971501234567'), 'E.164 UAE mobile is valid');
  assert(toUaeE164('0501234567') === '+971501234567', 'normalizes 0-prefixed UAE mobile');
  const result = validateSchema(employerContactSchema, {
    fullName: 'Ahmed Khan',
    designation: 'HR Manager',
    uaeMobile: '9876543210',
    whatsapp: '',
    businessEmail: 'hr@company.ae',
    preferredCommunication: 'WhatsApp',
    additionalContact: '',
  });
  assert(!result.success, 'invalid UAE phone is rejected');
}

// Missing company information
{
  const result = validateSchema(employerCompanySchema, {
    companyLegalName: 'SafeBuild LLC',
    tradeName: '',
    companyType: '',
    businessActivity: 'Construction',
    emirate: 'Dubai',
    website: '',
    linkedin: '',
    tradeLicencePath: 'path/licence.pdf',
    companyProfilePath: '',
  });
  assert(!result.success, 'missing company type is rejected');
}

// Multiple manpower requirements
{
  const electrician = {
    id: '1',
    trade: 'Electrician',
    customTrade: '',
    numberOfWorkers: '20',
    experience: '2–5 years',
    location: 'Dubai, UAE',
    projectName: '',
    joiningDate: '',
    projectDuration: '12 months',
    gender: 'Any',
    technicalSkills: ['Wiring', 'Single Phase'],
    additionalRequirements: '',
  };
  const plumber = {
    ...electrician,
    id: '2',
    trade: 'Plumber',
    numberOfWorkers: '10',
    technicalSkills: ['PVC', 'Leak Testing'],
  };
  const result = validateSchema(employerWorkforceSchema, { requirements: [electrician, plumber] });
  assert(result.success, 'multiple valid requirements are accepted');
  assert(skillsForTrade('Electrician').includes('DB / MCB'), 'electrician skills include DB / MCB');
  assert(skillsForTrade('Welder').includes('TIG'), 'welder skills include TIG');
  assert(skillsForTrade('Plumber').includes('PPR'), 'plumber skills include PPR');
}

// Add/remove equivalent: empty list rejected
{
  const result = validateSchema(employerWorkforceSchema, { requirements: [] });
  assert(!result.success, 'zero requirements rejected');
}

// Dynamic trade skills mismatch
{
  const result = validateSchema(manpowerRequirementSchema, {
    id: '1',
    trade: 'Electrician',
    customTrade: '',
    numberOfWorkers: '5',
    experience: '',
    location: 'Dubai, UAE',
    projectName: '',
    joiningDate: '',
    projectDuration: '',
    gender: 'Male',
    technicalSkills: ['TIG'],
    additionalRequirements: '',
  });
  assert(!result.success, 'welder skill on electrician is rejected');
}

// 1% model selection
{
  const ok = validateSchema(employerPartnershipSchema, { partnershipModel: 'percent_1', commercialNotes: '' });
  const missing = validateSchema(employerPartnershipSchema, { partnershipModel: '', commercialNotes: '' });
  assert(ok.success, '1% model is accepted');
  assert(!missing.success, 'missing commercial model is rejected');
}

// Declaration validation
{
  const missing = validateSchema(employerDeclarationsSchema, {
    authorized: false,
    accurate: true,
    regulations: true,
    contactOk: true,
  });
  const complete = validateSchema(employerDeclarationsSchema, {
    authorized: true,
    accurate: true,
    regulations: true,
    contactOk: true,
  });
  assert(!missing.success, 'unchecked declaration is rejected');
  assert(complete.success, 'all four declarations are accepted');
}

console.log('\nAll employer registration validation checks passed.');
