export type JobCustomField = {
  id: string;
  label: string;
  value: string;
};

export function newJobCustomField(label = 'Company Name', value = ''): JobCustomField {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    value,
  };
}

export function parseJobCustomFields(raw: unknown): JobCustomField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id
        ? item.id
        : `field-${index}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 7)}`,
      label: typeof item.label === 'string' ? item.label : '',
      value: typeof item.value === 'string' ? item.value : '',
    }))
    .filter((field) => field.label.trim() !== '' || field.value.trim() !== '');
}

export function cleanJobCustomFieldsForSave(fields: JobCustomField[]): Array<{ label: string; value: string }> {
  return fields
    .map((field) => ({
      label: field.label.trim(),
      value: field.value.trim(),
    }))
    .filter((field) => field.label !== '' && field.value !== '');
}

/** Extracts all company names from custom fields (case-insensitive label matching "company" or "employer"). */
export function extractCompanyNames(fields: Array<{ label?: string | null; value?: string | null }> | null | undefined): string[] {
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((field) => field && typeof field.value === 'string' && field.value.trim() !== '')
    .filter((field) => {
      const label = (field.label || '').toLowerCase();
      return label.includes('company') || label.includes('employer');
    })
    .map((field) => field.value!.trim());
}
