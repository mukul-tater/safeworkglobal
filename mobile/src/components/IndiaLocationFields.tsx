import React from 'react';
import SearchableSelect from './SearchableSelect';
import {
  getIndiaCities,
  getIndiaDistricts,
  getIndiaPincodes,
  getIndiaStates,
} from '../lib/indiaLocations';

type Value = {
  state: string;
  district: string;
  city: string;
  pincode: string;
};

type Props = {
  value: Value;
  onChange: (next: Value) => void;
  showCity?: boolean;
  showDistrict?: boolean;
  showPincode?: boolean;
  cityLabel?: string;
};

export default function IndiaLocationFields({
  value,
  onChange,
  showCity = true,
  showDistrict = true,
  showPincode = true,
  cityLabel = 'City',
}: Props) {
  const patch = (partial: Partial<Value>) => onChange({ ...value, ...partial });

  return (
    <>
      <SearchableSelect
        label="State"
        value={value.state}
        options={getIndiaStates()}
        onChange={(state) => patch({ state, district: '', city: '', pincode: '' })}
        placeholder="Select state"
      />
      {showDistrict ? (
        <SearchableSelect
          label="District"
          value={value.district}
          options={getIndiaDistricts(value.state)}
          onChange={(district) => patch({ district, city: '', pincode: '' })}
          placeholder={value.state ? 'Select district' : 'Select state first'}
          disabled={!value.state}
        />
      ) : null}
      {showCity ? (
        <SearchableSelect
          label={cityLabel}
          value={value.city}
          options={getIndiaCities(value.state, value.district)}
          onChange={(city) => patch({ city, pincode: '' })}
          placeholder={value.district ? 'Select city / town' : 'Select district first'}
          disabled={!value.district}
          allowCustom
        />
      ) : null}
      {showPincode ? (
        <SearchableSelect
          label="PIN Code"
          value={value.pincode}
          options={getIndiaPincodes(value.state, value.district, value.city)}
          onChange={(pincode) => patch({ pincode })}
          placeholder={value.district ? 'Select PIN code' : 'Select district first'}
          disabled={!value.district}
          allowCustom
        />
      ) : null}
    </>
  );
}
