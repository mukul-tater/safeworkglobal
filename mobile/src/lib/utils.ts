export function formatSalaryINR(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'INR',
): string {
  const toINR = (val: number) => (currency === 'INR' ? val : val * 83);

  if (min == null && max == null) return 'Salary not specified';
  if (min != null && max != null) {
    return `₹${toINR(min).toLocaleString('en-IN')} - ₹${toINR(max).toLocaleString('en-IN')}`;
  }
  if (min != null) return `From ₹${toINR(min).toLocaleString('en-IN')}`;
  return `Up to ₹${toINR(max!).toLocaleString('en-IN')}`;
}

export function formatSalaryLakh(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'USD',
): string {
  const toINR = (val: number) => (currency === 'INR' ? val : val * 83);

  const toLakhLabel = (inr: number) => {
    const lakhs = inr / 100_000;
    if (lakhs >= 1) {
      const rounded = Math.round(lakhs * 10) / 10;
      const text = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
      return `₹${text}L`;
    }
    return `₹${Math.round(inr).toLocaleString('en-IN')}`;
  };

  if (min == null && max == null) return 'Not disclosed';
  if (min != null && max != null) {
    return `${toLakhLabel(toINR(min))} - ${toLakhLabel(toINR(max))}`;
  }
  if (min != null) return `From ${toLakhLabel(toINR(min))}`;
  return `Up to ${toLakhLabel(toINR(max!))}`;
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
