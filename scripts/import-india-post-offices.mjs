#!/usr/bin/env node
/**
 * Import the India Post All India Pincode Directory once.
 *
 * The CSV is not committed. Download it (data.gov.in, or a mirror with the
 * columns officename, pincode, officeType, Districtname, statename) and pass
 * the path. This writes the slim state/district index used by the dropdowns
 * and, when SUPABASE_SERVICE_ROLE_KEY is set, loads india_post_offices.
 *
 * Usage:
 *   node scripts/import-india-post-offices.mjs --csv /tmp/all-india-pincode.csv
 *   node scripts/import-india-post-offices.mjs --csv ./pincode.csv --index-only
 */
import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const WEB_INDEX = new URL('../src/lib/indiaLocations.json', import.meta.url);
const MOBILE_INDEX = new URL('../mobile/src/lib/indiaLocations.json', import.meta.url);
const BATCH = 500;

const STATE_CANONICAL = {
  'ANDAMAN & NICOBAR ISLANDS': 'Andaman and Nicobar Islands',
  'ANDAMAN AND NICOBAR ISLANDS': 'Andaman and Nicobar Islands',
  CHATTISGARH: 'Chhattisgarh',
  CHHATTISGARH: 'Chhattisgarh',
  'DADRA & NAGAR HAVELI': 'Dadra and Nagar Haveli',
  'DADRA AND NAGAR HAVELI': 'Dadra and Nagar Haveli',
  'DAMAN & DIU': 'Daman and Diu',
  'DAMAN AND DIU': 'Daman and Diu',
  DELHI: 'Delhi',
  'NCT OF DELHI': 'Delhi',
  'JAMMU & KASHMIR': 'Jammu and Kashmir',
  'JAMMU AND KASHMIR': 'Jammu and Kashmir',
  ORISSA: 'Odisha',
  ODISHA: 'Odisha',
  PONDICHERRY: 'Puducherry',
  PUDUCHERRY: 'Puducherry',
  UTTARANCHAL: 'Uttarakhand',
  UTTARAKHAND: 'Uttarakhand',
};

const EXTRA_STATE_ALIASES = {
  Orissa: 'Odisha',
  Pondicherry: 'Puducherry',
  Chattisgarh: 'Chhattisgarh',
  'Jammu & Kashmir': 'Jammu and Kashmir',
  'Andaman & Nicobar Islands': 'Andaman and Nicobar Islands',
  'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli',
  'Daman & Diu': 'Daman and Diu',
  'NCT of Delhi': 'Delhi',
};

const COMBINED_STATES = {
  'Dadra and Nagar Haveli and Daman and Diu': ['Dadra and Nagar Haveli', 'Daman and Diu'],
};

const LADAKH_DISTRICTS = new Set(['leh', 'kargil']);

const MANUAL_DISTRICT_ALIASES = [
  ['Delhi', 'Central', 'Central Delhi'],
  ['Delhi', 'East', 'East Delhi'],
  ['Delhi', 'North', 'North Delhi'],
  ['Delhi', 'North East', 'North East Delhi'],
  ['Delhi', 'North West', 'North West Delhi'],
  ['Delhi', 'South', 'South Delhi'],
  ['Delhi', 'South West', 'South West Delhi'],
  ['Delhi', 'West', 'West Delhi'],
];
const TYPE_RANK = { HO: 3, SO: 2, BO: 1 };

function parseArgs(argv) {
  let csv = '/tmp/all-india-pincode.csv';
  let indexOnly = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--csv' && argv[i + 1]) csv = argv[++i];
    else if (argv[i] === '--index-only') indexOnly = true;
  }
  return { csv, indexOnly };
}

function loadEnv() {
  try {
    const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  } catch {
    /* no .env */
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cur);
      cur = '';
    } else if (char === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else if (char !== '\r') cur += char;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

function titleCase(upper) {
  return upper.toLowerCase().replace(/(^|[^a-z0-9'])([a-z])/g, (_, prefix, letter) => prefix + letter.toUpperCase());
}

function canonicalStateName(raw) {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  const upper = cleaned.toUpperCase();
  return STATE_CANONICAL[upper] || titleCase(upper);
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function keysOf(name) {
  const paren = [...name.matchAll(/\(([^)]+)\)/g)].map((match) => normalizeKey(match[1]));
  return [...new Set([normalizeKey(name), ...paren].filter(Boolean))];
}

function officeDisplayName(raw) {
  let name = raw.trim().replace(/\s+/g, ' ');
  name = name.replace(/\s+B\.O directly a\/w Head Office$/i, '');
  name = name.replace(/\s+(?:B\.O|S\.O|H\.O|G\.P\.O)\.?(?=\s*\(|$)/i, '');
  name = name.replace(/\s+/g, ' ').trim();
  if (!name || name === 'NA' || name === 'NULL') return '';
  return name;
}

function canonicalDistrictName(raw) {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (/^dadra\s*&\s*nagar haveli$/i.test(cleaned)) return 'Dadra and Nagar Haveli';
  if (/^jhujhunu$/i.test(cleaned)) return 'Jhunjhunu';
  return cleaned;
}

function ladakhDistrict(oldName) {
  const keys = keysOf(oldName);
  if (keys.some((key) => key === 'kargil')) return 'Kargil';
  if (keys.some((key) => key === 'leh' || key === 'leh ladakh')) return 'Leh';
  return '';
}

function officeTypeCode(raw) {
  const upper = raw.trim().toUpperCase();
  if (upper.startsWith('H')) return 'HO';
  if (upper.startsWith('S')) return 'SO';
  return 'BO';
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  const next = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    next[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j < next.length; j++) prev[j] = next[j];
  }
  return prev[b.length];
}

function fuzzyDistrict(oldName, candidates) {
  const needle = normalizeKey(oldName);
  if (needle.length < 5) return '';
  let best = '';
  let bestScore = 99;
  let second = 99;
  for (const candidate of candidates) {
    const score = editDistance(needle, normalizeKey(candidate));
    if (score < bestScore) {
      second = bestScore;
      bestScore = score;
      best = candidate;
    } else if (score < second) second = score;
  }
  if (best && bestScore <= 1 && second > bestScore) return best;
  return '';
}

function indexByKey(names) {
  const byKey = new Map();
  for (const name of names) {
    for (const key of keysOf(name)) {
      const list = byKey.get(key) ?? [];
      list.push(name);
      byKey.set(key, list);
    }
  }
  return byKey;
}

function matchOldDistricts(aliasState, oldNode, districtMap, aliases) {
  const byKey = indexByKey(districtMap.keys());
  for (const oldName of Object.keys(oldNode)) {
    let found = '';
    for (const key of keysOf(oldName)) {
      const hits = byKey.get(key);
      if (!hits || hits.length === 0) continue;
      found = hits.includes(oldName) ? oldName : hits.length === 1 ? hits[0] : '';
      if (found) break;
    }
    if (!found) found = fuzzyDistrict(oldName, districtMap.keys());
    if (found && found !== oldName) aliases.districts[`${aliasState}|${oldName}`] = found;
    else if (!found) {
      const moved = aliasState === 'Jammu and Kashmir' ? ladakhDistrict(oldName) : '';
      if (moved) {
        aliases.relocate[`${aliasState}|${oldName}`] = { state: 'Ladakh', district: moved };
      } else if (!districtMap.has(oldName)) districtMap.set(oldName, new Map());
    }
  }
}

function buildDirectory(rows) {
  const header = rows[0].map((cell) => cell.trim());
  const col = Object.fromEntries(header.map((name, index) => [name, index]));
  for (const required of ['officename', 'pincode', 'officeType', 'Districtname', 'statename']) {
    if (col[required] === undefined) throw new Error(`CSV is missing column ${required}`);
  }

  /** @type {Map<string, Map<string, Map<string, { pins: Set<string>, type: string }>>>} */
  const tree = new Map();
  let skipped = 0;

  for (const cells of rows.slice(1)) {
    const stateRaw = (cells[col.statename] || '').trim();
    const districtRaw = (cells[col.Districtname] || '').trim();
    if (!stateRaw || !districtRaw || stateRaw === 'NULL' || districtRaw === 'NULL') {
      skipped++;
      continue;
    }
    const pin = (cells[col.pincode] || '').trim();
    if (!/^[1-9]\d{5}$/.test(pin)) {
      skipped++;
      continue;
    }
    const office = officeDisplayName(cells[col.officename] || '');
    if (office.length < 2) {
      skipped++;
      continue;
    }
    const state = canonicalStateName(stateRaw);
    const district = canonicalDistrictName(districtRaw);
    if (!tree.has(state)) tree.set(state, new Map());
    const districts = tree.get(state);
    if (!districts.has(district)) districts.set(district, new Map());
    const offices = districts.get(district);
    const type = officeTypeCode(cells[col.officeType] || '');
    const existing = offices.get(office) ?? { pins: new Set(), type };
    existing.pins.add(pin);
    if ((TYPE_RANK[type] ?? 0) > (TYPE_RANK[existing.type] ?? 0)) existing.type = type;
    offices.set(office, existing);
  }

  const jammu = tree.get('Jammu and Kashmir');
  if (jammu) {
    if (!tree.has('Ladakh')) tree.set('Ladakh', new Map());
    const ladakh = tree.get('Ladakh');
    for (const [district, offices] of jammu) {
      if (LADAKH_DISTRICTS.has(district.toLowerCase())) {
        ladakh.set(district, offices);
        jammu.delete(district);
      }
    }
  }

  return { tree, skipped };
}

function applyOldNames(tree) {
  const old = JSON.parse(readFileSync(WEB_INDEX, 'utf8'));
  if (old.states && old.aliases) {
    for (const [state, districts] of Object.entries(old.states)) {
      if (!Array.isArray(districts)) continue;
      if (!tree.has(state)) tree.set(state, new Map());
      const map = tree.get(state);
      for (const district of districts) {
        if (!map.has(district)) map.set(district, new Map());
      }
    }
    return {
      states: old.aliases.states ?? {},
      districts: old.aliases.districts ?? {},
      combinedStates: { ...COMBINED_STATES, ...(old.aliases.combinedStates ?? {}) },
      relocate: old.aliases.relocate ?? {},
    };
  }

  const oldStates = old;
  if (!oldStates || typeof oldStates !== 'object') {
    return {
      states: {},
      districts: {},
      combinedStates: COMBINED_STATES,
      relocate: {},
    };
  }

  const aliases = {
    states: {},
    districts: {},
    combinedStates: { ...COMBINED_STATES },
    relocate: {},
  };

  const stateByKey = new Map();
  for (const state of tree.keys()) {
    for (const key of keysOf(state)) stateByKey.set(key, state);
  }

  for (const [alias, target] of Object.entries(EXTRA_STATE_ALIASES)) {
    if (tree.has(target)) aliases.states[alias] = target;
  }

  for (const [oldState, oldDistricts] of Object.entries(oldStates)) {
    if (!oldDistricts || typeof oldDistricts !== 'object' || Array.isArray(oldDistricts)) continue;
    const parts = aliases.combinedStates[oldState];
    if (parts) {
      const pool = new Map();
      for (const part of parts) {
        for (const [district, offices] of tree.get(part) ?? []) pool.set(district, offices);
      }
      const before = new Set(pool.keys());
      matchOldDistricts(oldState, oldDistricts, pool, aliases);
      const owner = parts.find((part) => tree.has(part)) || parts[0];
      if (!tree.has(owner)) tree.set(owner, new Map());
      const target = tree.get(owner);
      for (const [district, offices] of pool) {
        if (!before.has(district)) target.set(district, offices);
      }
      continue;
    }

    const matched = tree.has(oldState) ? oldState : stateByKey.get(normalizeKey(oldState)) || '';
    if (!matched) {
      tree.set(oldState, new Map(Object.keys(oldDistricts).map((district) => [district, new Map()])));
      continue;
    }
    if (matched !== oldState) aliases.states[oldState] = matched;
    matchOldDistricts(matched, oldDistricts, tree.get(matched), aliases);
  }

  for (const [state, oldName, canonical] of MANUAL_DISTRICT_ALIASES) {
    const map = tree.get(state);
    if (!map || !map.has(canonical) || oldName === canonical) continue;
    aliases.districts[`${state}|${oldName}`] = canonical;
    const existing = map.get(oldName);
    if (existing && existing.size === 0) map.delete(oldName);
  }

  return aliases;
}

function toIndex(tree, aliases) {
  const states = {};
  for (const state of [...tree.keys()].sort((a, b) => a.localeCompare(b))) {
    states[state] = [...tree.get(state).keys()].sort((a, b) => a.localeCompare(b));
  }
  return { states, aliases };
}

function flattenOffices(tree) {
  const rows = [];
  for (const [state, districts] of tree) {
    for (const [district, offices] of districts) {
      for (const [officeName, office] of offices) {
        for (const pincode of office.pins) {
          rows.push({
            state,
            district,
            office_name: officeName,
            pincode,
            office_type: office.type,
          });
        }
      }
    }
  }
  return rows;
}

async function loadDatabase(rows) {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('No SUPABASE_SERVICE_ROLE_KEY — wrote the state/district index only.');
    console.log('Apply supabase/migrations/20260929120000_india_post_offices.sql, then re-run this script to load offices.');
    return;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  for (let offset = 0; offset < rows.length; offset += BATCH) {
    const batch = rows.slice(offset, offset + BATCH);
    const { error } = await supabase.from('india_post_offices').upsert(batch, {
      onConflict: 'state,district,office_name,pincode',
      ignoreDuplicates: true,
    });
    if (error) throw new Error(error.message);
    console.log(`Loaded ${Math.min(offset + BATCH, rows.length)} / ${rows.length}`);
  }
}

function countOffices(tree, state, district) {
  return tree.get(state)?.get(district)?.size ?? 0;
}

async function main() {
  const { csv, indexOnly } = parseArgs(process.argv.slice(2));
  const text = readFileSync(csv, 'utf8');
  const { tree, skipped } = buildDirectory(parseCsv(text));
  const aliases = applyOldNames(tree);
  const index = toIndex(tree, aliases);
  const body = `${JSON.stringify(index, null, 2)}\n`;
  writeFileSync(WEB_INDEX, body);
  writeFileSync(MOBILE_INDEX, body);

  const officeRows = indexOnly ? [] : flattenOffices(tree);
  const districtCount = Object.values(index.states).reduce((sum, list) => sum + list.length, 0);
  console.log(
    JSON.stringify(
      {
        states: Object.keys(index.states).length,
        districts: districtCount,
        offices: indexOnly ? undefined : officeRows.length,
        skipped,
        stateAliases: Object.keys(aliases.states).length,
        districtAliases: Object.keys(aliases.districts).length,
        jaipurLocalities: countOffices(tree, 'Rajasthan', 'Jaipur'),
        jodhpurLocalities: countOffices(tree, 'Rajasthan', 'Jodhpur'),
      },
      null,
      2,
    ),
  );

  if (!indexOnly) await loadDatabase(officeRows);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
