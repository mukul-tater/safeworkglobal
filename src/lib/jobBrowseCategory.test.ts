import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jobBrowseCategory } from './jobBrowseCategory';

const affectedTrades = [
  ['MIG Welder', 'Welder', 'MIG Welder'],
  ['TIG Welder', 'Welder', 'TIG Welder'],
  ['Cleaner (Male)', 'Cleaner', 'Cleaner (Male)'],
  ['Cleaner (Female)', 'Cleaner', 'Cleaner (Female)'],
  ['Construction Labour', 'Construction', 'Construction Labour/Helper'],
  ['Furniture Carpenter - सुथार , बढ़ई', 'Carpenter', 'Furniture Carpenter - Finishing, All Rounder'],
  ['GI Steel Pipe Fitter', 'Fitter', 'Pipe Fitter'],
  ['Shuttering Carpenter - शटरिंग , सेंटरिंग मिस्त्री', 'Carpentry', 'Shuttering Carpenter'],
  ['Steel Fixer', 'Construction', 'Steel Fixer'],
  ['Warehouse Helper', 'Driver & Logistics', 'Warehouse Helper'],
  ['Mason (Bricks / Plaster)', 'Mason', 'Mason (bricks/plaster)'],
  ['Mason (Raj Mistri / Tiles / Marble)', 'Mason', 'Mason (tiles/marble)'],
  ['Nanny / House Maid', 'Cleaning & Maintenance', 'Nanny / House Maid'],
  ['Nanny/ House Maid', 'Cleaning & Maintenance', 'Nanny / House Maid'],
];

for (const [title, saved, expected] of affectedTrades) {
  test(`${title} remains reachable through its UAE trade despite broad category ${saved}`, () => {
    assert.equal(jobBrowseCategory(title, '', 'UAE', saved), expected);
  });
}

test('non-UAE listings retain their saved categories', () => {
  assert.equal(jobBrowseCategory('Welder', '', 'Europe', 'Manufacturing'), 'Manufacturing');
});