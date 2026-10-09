import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/lib/constants';
import { adminRangeSalaryDisplay, finiteSalary } from '@/lib/jobSalaryUtils';
import { invalidFieldClass } from '@/lib/formErrors';

interface RangeFieldProps {
  legend: string;
  hint: string;
  minId: string;
  maxId: string;
  currencyId: string;
  currency: string | undefined;
  onCurrencyChange: (value: string) => void;
  minRegister: UseFormRegisterReturn;
  maxRegister: UseFormRegisterReturn;
  minError?: FieldError;
  maxError?: FieldError;
  currencyError?: FieldError;
}

function SalaryRangeFields({
  legend,
  hint,
  minId,
  maxId,
  currencyId,
  currency,
  onCurrencyChange,
  minRegister,
  maxRegister,
  minError,
  maxError,
  currencyError,
}: RangeFieldProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium">{legend}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div data-field={minRegister.name}>
          <Label htmlFor={minId}>Min</Label>
          <Input
            id={minId}
            type="number"
            min={0}
            aria-invalid={!!minError}
            className={minError ? invalidFieldClass : undefined}
            {...minRegister}
          />
          {minError && <p className="mt-1 text-sm text-destructive">{minError.message}</p>}
        </div>
        <div data-field={maxRegister.name}>
          <Label htmlFor={maxId}>Max</Label>
          <Input
            id={maxId}
            type="number"
            min={0}
            aria-invalid={!!maxError}
            className={maxError ? invalidFieldClass : undefined}
            {...maxRegister}
          />
          {maxError && <p className="mt-1 text-sm text-destructive">{maxError.message}</p>}
        </div>
        <div data-field={currencyId}>
          <Label htmlFor={currencyId}>Currency</Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger
              id={currencyId}
              aria-invalid={!!currencyError}
              className={currencyError ? invalidFieldClass : undefined}
            >
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {CURRENCIES.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.code} ({item.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currencyError && <p className="mt-1 text-sm text-destructive">{currencyError.message}</p>}
        </div>
      </div>
    </div>
  );
}

interface AdminSalaryRangesProps {
  localCurrency: string | undefined;
  countryCurrency: string | undefined;
  localMin: number | undefined;
  localMax: number | undefined;
  countryMin: number | undefined;
  countryMax: number | undefined;
  onLocalCurrencyChange: (value: string) => void;
  onCountryCurrencyChange: (value: string) => void;
  localMinRegister: UseFormRegisterReturn;
  localMaxRegister: UseFormRegisterReturn;
  countryMinRegister: UseFormRegisterReturn;
  countryMaxRegister: UseFormRegisterReturn;
  localMinError?: FieldError;
  localMaxError?: FieldError;
  localCurrencyError?: FieldError;
  countryMinError?: FieldError;
  countryMaxError?: FieldError;
  countryCurrencyError?: FieldError;
}

export default function AdminSalaryRanges({
  localCurrency,
  countryCurrency,
  localMin,
  localMax,
  countryMin,
  countryMax,
  onLocalCurrencyChange,
  onCountryCurrencyChange,
  localMinRegister,
  localMaxRegister,
  countryMinRegister,
  countryMaxRegister,
  localMinError,
  localMaxError,
  localCurrencyError,
  countryMinError,
  countryMaxError,
  countryCurrencyError,
}: AdminSalaryRangesProps) {
  const preview = adminRangeSalaryDisplay({
    local_salary_min: finiteSalary(localMin),
    local_salary_max: finiteSalary(localMax),
    local_salary_currency: localCurrency || 'INR',
    salary_min: finiteSalary(countryMin),
    salary_max: finiteSalary(countryMax),
    currency: countryCurrency || 'INR',
  });

  return (
    <div className="space-y-4">
      <SalaryRangeFields
        legend="Local range"
        hint="What workers compare at home. INR is the usual choice."
        minId="local_salary_min"
        maxId="local_salary_max"
        currencyId="local_salary_currency"
        currency={localCurrency}
        onCurrencyChange={onLocalCurrencyChange}
        minRegister={localMinRegister}
        maxRegister={localMaxRegister}
        minError={localMinError}
        maxError={localMaxError}
        currencyError={localCurrencyError}
      />
      <SalaryRangeFields
        legend="Country range"
        hint="Pay in the destination country, such as CZK or AED."
        minId="salary_min"
        maxId="salary_max"
        currencyId="currency"
        currency={countryCurrency}
        onCurrencyChange={onCountryCurrencyChange}
        minRegister={countryMinRegister}
        maxRegister={countryMaxRegister}
        minError={countryMinError}
        maxError={countryMaxError}
        currencyError={countryCurrencyError}
      />
      <p className="text-xs text-muted-foreground">
        Workers see: {preview || 'the saved pay line, until a local range is entered.'}
      </p>
    </div>
  );
}
