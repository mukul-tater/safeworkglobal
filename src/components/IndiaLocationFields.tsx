import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import SearchSelect from '@/components/SearchSelect';
import {
  getIndiaCities,
  getIndiaCitiesInState,
  getIndiaDistricts,
  getIndiaPincodes,
  getIndiaStates,
} from '@/lib/indiaLocations';
import { cn } from '@/lib/utils';

export type IndiaLocationValue = {
  state: string;
  district: string;
  city: string;
  pincode: string;
};

type Props = {
  value: IndiaLocationValue;
  onChange: (next: IndiaLocationValue) => void;
  errors?: Partial<Record<keyof IndiaLocationValue, string>>;
  showCity?: boolean;
  showDistrict?: boolean;
  showPincode?: boolean;
  cityLabel?: string;
  cityAllowCustom?: boolean;
  /** Shown under the city field. Pass empty string to hide. */
  cityHint?: string;
  className?: string;
};

function FieldWrap({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function IndiaLocationFields({
  value,
  onChange,
  errors,
  showCity = true,
  showDistrict = true,
  showPincode = true,
  cityLabel = 'Village / Town / City',
  cityAllowCustom = true,
  cityHint = 'If your village is not listed, select the nearest city.',
  className,
}: Props) {
  const states = getIndiaStates();
  const districts = getIndiaDistricts(value.state);
  const cities = showDistrict
    ? getIndiaCities(value.state, value.district)
    : getIndiaCitiesInState(value.state);
  const pincodes = getIndiaPincodes(value.state, value.district, value.city);

  const patch = (partial: Partial<IndiaLocationValue>) => onChange({ ...value, ...partial });

  return (
    <div className={cn(className)}>
      <FieldWrap label="State" error={errors?.state} required>
        <SearchSelect
          value={value.state}
          onChange={(state) => patch({ state, district: '', city: '', pincode: '' })}
          options={states}
          title="State"
          placeholder="Select state"
          searchPlaceholder="Search state"
        />
      </FieldWrap>

      {showDistrict ? (
        <FieldWrap label="District" error={errors?.district} required>
          <SearchSelect
            value={value.district}
            onChange={(district) => patch({ district, city: '', pincode: '' })}
            options={districts}
            placeholder={value.state ? 'Select district' : 'Select state first'}
            searchPlaceholder="Search district"
            title="District"
            disabled={!value.state}
            emptyText="Select a state first"
          />
        </FieldWrap>
      ) : null}

      {showCity ? (
        <FieldWrap label={cityLabel} error={errors?.city} hint={cityHint} required>
          <SearchSelect
            value={value.city}
            onChange={(city) => patch({ city, pincode: '' })}
            options={cities}
            placeholder={
              showDistrict
                ? value.district
                  ? 'Select city or nearest city'
                  : 'Select district first'
                : value.state
                  ? 'Select city or nearest city'
                  : 'Select state first'
            }
            searchPlaceholder="Search city / town"
            title={cityLabel}
            disabled={showDistrict ? !value.district : !value.state}
            emptyText={
              (showDistrict ? value.district : value.state)
                ? 'No match — select the nearest city'
                : showDistrict
                  ? 'Select a district first'
                  : 'Select a state first'
            }
            allowCustom={cityAllowCustom}
            customHint="Use this village / town name"
          />
        </FieldWrap>
      ) : null}

      {showPincode ? (
        <FieldWrap label="PIN Code" error={errors?.pincode} required>
          <SearchSelect
            value={value.pincode}
            onChange={(pincode) => patch({ pincode })}
            options={pincodes}
            placeholder={
              showDistrict
                ? value.district
                  ? 'Select PIN code'
                  : 'Select district first'
                : 'Select location first'
            }
            searchPlaceholder="Search PIN code"
            title="PIN Code"
            disabled={showDistrict ? !value.district : !value.state}
            emptyText="No PIN codes for this location"
            allowCustom
            isValidCustom={(q) => /^[1-9]\d{5}$/.test(q.trim())}
            customHint="Use this PIN code"
            inputMode="numeric"
          />
        </FieldWrap>
      ) : null}
    </div>
  );
}
