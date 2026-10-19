import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Theme compatibility: the PortionBridge theme is class-based design tokens
 * (bg-surface, text-text-primary, dash-primary …) that switch with `.dark`.
 * The Disaster Relief UI must use only those tokens — raw palette colours would
 * not follow the theme, and purple/violet is explicitly out of the design.
 */
const root = join(import.meta.dirname, '..');
const files = [
  ...readdirSync(join(root, 'components/relief')).filter((f) => f.endsWith('.jsx') && !f.endsWith('.test.jsx')).map((f) => `components/relief/${f}`),
  'pages/DisasterReliefPage.jsx', 'pages/DisasterIncidentPage.jsx', 'pages/ReliefRequestPage.jsx',
  'pages/MyReliefPledgesPage.jsx', 'pages/ReliefPledgeDetailPage.jsx', 'pages/VolunteerReliefTasksPage.jsx',
  'pages/ReliefTaskPage.jsx', 'pages/AdminReliefReviewPage.jsx',
];

const FORBIDDEN = [
  { name: 'purple/violet/indigo/fuchsia palette', re: /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:purple|violet|indigo|fuchsia)-\d+/ },
  { name: 'raw gray/slate/zinc/neutral palette', re: /\b(?:bg|text|border|ring)-(?:gray|slate|zinc|neutral|stone)-\d+/ },
  { name: 'hard-coded white/black surfaces', re: /\b(?:bg-white|bg-black|text-black)\b/ },
];

describe('Disaster Relief UI theme compatibility', () => {
  it.each(files)('%s uses theme tokens only', (file) => {
    const source = readFileSync(join(root, file), 'utf8');
    FORBIDDEN.forEach(({ name, re }) => expect(source, `${file}: ${name}`).not.toMatch(re));
  });

  it('map CSS has dark-theme rules and no purple', () => {
    const css = readFileSync(join(root, 'index.css'), 'utf8');
    const block = css.slice(css.indexOf('Disaster Relief map (Leaflet)'));
    expect(block).toMatch(/\.dark \.pb-disaster-map/);
    expect(block).not.toMatch(/purple|violet|#7c3aed|#8b5cf6|#a855f7/i);
  });

  it('marker severity colours avoid purple', async () => {
    const { SEVERITY_COLORS } = await import('../utils/relief');
    Object.values(SEVERITY_COLORS).forEach((hex) => expect(hex).not.toMatch(/#(7c3aed|8b5cf6|a855f7|9333ea|6d28d9)/i));
  });
});
