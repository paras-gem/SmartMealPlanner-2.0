import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecipeSearchCandidates } from '../lib/recipeSearch.js';

test('expands fuzzy search terms like ice-cream', () => {
  const terms = buildRecipeSearchCandidates('ice-cream');

  assert(terms.some((term) => term.includes('ice')));
  assert(terms.some((term) => term.includes('cream')));
  assert(terms.includes('dessert'));
});

test('splits multi-word queries into smaller search terms', () => {
  const terms = buildRecipeSearchCandidates('chicken curry');

  assert(terms.includes('chicken curry'));
  assert(terms.includes('chicken'));
  assert(terms.includes('curry'));
});
