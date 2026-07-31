export type TradeTestCenter = {
  id: string;
  name: string;
  city: string;
  state: string;
};

/** Fixed morning reporting window for physical trade tests. */
export const TRADE_TEST_REPORTING_WINDOW = '9:00 AM – 10:00 AM';
export const TRADE_TEST_REPORTING_WINDOW_HINT =
  'Report at the centre between 9:00 AM and 10:00 AM on your test day.';

/**
 * Active booking hubs — one primary centre per state.
 * e.g. Rajasthan workers are assigned Jaipur only.
 */
export const TRADE_TEST_CENTERS: TradeTestCenter[] = [
  {
    id: 'jaipur',
    name: 'Trade Test Center — Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
  },
  {
    id: 'delhi',
    name: 'Trade Test Center — Delhi',
    city: 'Delhi',
    state: 'Delhi',
  },
  {
    id: 'mumbai',
    name: 'Trade Test Center — Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
  },
  {
    id: 'hyderabad',
    name: 'Trade Test Center — Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
  },
  {
    id: 'lucknow',
    name: 'Trade Test Center — Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
  },
  {
    id: 'kochi',
    name: 'Trade Test Center — Kochi',
    city: 'Kochi',
    state: 'Kerala',
  },
];

function normalizeState(state: string | null | undefined): string {
  return (state || '').trim().toLowerCase();
}

/** Centres available for a worker's home state (auto-generated options). */
export function getTradeTestCentersForState(
  state: string | null | undefined,
): TradeTestCenter[] {
  const key = normalizeState(state);
  if (!key) return [];
  return TRADE_TEST_CENTERS.filter((c) => normalizeState(c.state) === key);
}

export function getTradeTestCenterById(
  id: string | null | undefined,
): TradeTestCenter | undefined {
  if (!id) return undefined;
  return TRADE_TEST_CENTERS.find((c) => c.id === id);
}
