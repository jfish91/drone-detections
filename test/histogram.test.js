// test for histogram
import test from 'node:test';
import assert from 'node:assert/strict';
import { binRssi } from '../src/server/detection-state.js';

const opts = { min: -110, max: -65, binSize: 5 };

test('produces 9 bins for -110..-65 in steps of 5', () => {
  const { labels, counts } = binRssi([], opts);
  assert.equal(labels.length, 9);
  assert.equal(counts.length, 9);
  assert.equal(labels[0], '-110 to -105');
  assert.equal(labels[8], '-70 to -65');
});

test('lower edge is inclusive, upper edge exclusive', () => {
  const { counts } = binRssi([-110, -105], opts);
  assert.equal(counts[0], 1); // -110 -> first bin
  assert.equal(counts[1], 1); // -105 -> second bin
});

test('max value lands in the last bin', () => {
  const { counts } = binRssi([-65], opts);
  assert.equal(counts[8], 1);
});

test('ignores out-of-range and non-numeric values', () => {
  const { counts } = binRssi([-120, -60, NaN, '-90'], opts);
  assert.equal(counts.reduce((a, b) => a + b, 0), 0);
});