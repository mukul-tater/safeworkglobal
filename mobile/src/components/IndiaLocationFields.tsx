import React, { useCallback, useEffect } from 'react';
import SearchableSelect from './SearchableSelect';
import {
  getIndiaDistricts,
  getIndiaStates,
  INDIA_LOCALITY_WINDOW,
  pincodesFromLocalities,
  resolveIndiaPlace,
  searchIndiaLocalities,
} from '../lib/indiaLocations';
import { useIndiaLocalities } from '../lib/useIndiaLocalities';

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
  /** Shown under the city field. Pass empty string to hide. */
  cityHint?: string;
};

export default function IndiaLocationFields({
  value,
  onChange,
  showCity = true,
  showDistrict = true,
  showPincode = true,
  cityLabel = 'Village / Town / City',
  cityHint = 'Search your village, town, or city. If it is not listed, type the name.',
}: Props) {
  const { localities, loading, failed } = useIndiaLocalities(
    value.state,
    showDistrict ? value.district : '',
  );
  const waiting = showDistrict && loading && !failed;
  const patch = (partial: Partial<Value>) => onChange({ ...value, ...partial });
  const searchCities = useCallback(
    (query: string) => searchIndiaLocalities(value.state, query).then((rows) => rows.map((row) => row.name)),
    [value.state],
  );

  useEffect(() => {
    const place = resolveIndiaPlace(value.state, showDistrict ? value.district : '');
    const nextState = place.state;
    const nextDistrict = showDistrict ? place.district : value.district;
    if (nextState === value.state && nextDistrict === value.district) return;
    onChange({ ...value, state: nextState, district: nextDistrict });
  }, [onChange, showDistrict, value]);

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
          options={showDistrict ? localities.map((locality) => locality.name) : []}
          remoteSearch={showDistrict ? undefined : searchCities}
          maxVisible={INDIA_LOCALITY_WINDOW}
          loading={waiting}
          onChange={(city) => patch({ city, pincode: '' })}
          placeholder={
            showDistrict
              ? waiting
                ? 'Loading localities…'
                : value.district
                  ? 'Select city or nearest city'
                  : 'Select district first'
              : value.state
                ? 'Search city or nearest city'
                : 'Select state first'
          }
          disabled={showDistrict ? !value.district : !value.state}
          allowCustom
          emptyText={
            failed
              ? 'Could not load the list — type your village'
              : 'No match — type your village or town'
          }
          hint={cityHint}
        />
      ) : null}
      {showPincode ? (
        <SearchableSelect
          label="PIN Code"
          value={value.pincode}
          options={pincodesFromLocalities(localities, value.city)}
          maxVisible={INDIA_LOCALITY_WINDOW}
          loading={waiting}
          onChange={(pincode) => patch({ pincode })}
          placeholder={waiting ? 'Loading PIN codes' : value.district ? 'Select PIN code' : 'Select district first'}
          disabled={showDistrict ? !value.district || waiting : !value.state}
          allowCustom
          emptyText={failed ? 'Could not load PIN codes — type a 6-digit PIN' : 'No PIN codes for this location'}
        />
      ) : null}
    </>
  );
}
