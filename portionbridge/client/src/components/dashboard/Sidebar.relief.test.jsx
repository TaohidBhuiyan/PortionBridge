import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1, name: 'Test User', role: 'donor' } }) }));
vi.mock('../../context/SocketContext', () => ({ useAuthSocket: () => ({ unreadCount: 0, unreadMessageCount: 0 }) }));

import { Sidebar } from './Sidebar';

const renderSidebar = (userRole, currentPath = '/') => render(
  <MemoryRouter>
    <Sidebar collapsed={false} open onToggle={() => {}} onMobileToggle={() => {}} userRole={userRole} currentPath={currentPath} onLogout={() => {}} />
  </MemoryRouter>
);
const hrefs = () => screen.getAllByRole('link').map((a) => a.getAttribute('href'));

describe('Sidebar navigation (regression + new entry)', () => {
  it.each([
    ['donor', ['/donor/dashboard', '/donor/my-donations', '/donor/discover-volunteers']],
    ['volunteer', ['/volunteer/dashboard', '/volunteer/opportunities', '/volunteer/mission', '/volunteer/history']],
    ['admin', ['/admin/dashboard', '/admin/users', '/admin/donations']],
  ])('%s keeps every existing entry and gains Disaster Relief', (role, existing) => {
    renderSidebar(role);
    const links = hrefs();
    existing.forEach((path) => expect(links).toContain(path));
    expect(links).toContain('/relief');
    expect(screen.getAllByText('Disaster Relief').length).toBeGreaterThan(0);
  });

  it('appears as often as any existing entry (the Sidebar renders desktop + mobile menus)', () => {
    renderSidebar('donor');
    const count = (path) => hrefs().filter((h) => h === path).length;
    expect(count('/relief')).toBeGreaterThan(0);
    expect(count('/relief')).toBe(count('/donor/my-donations'));
  });

  it('highlights Disaster Relief on its nested pages', () => {
    renderSidebar('donor', '/relief/incidents/12');
    const link = screen.getAllByRole('link').find((a) => a.getAttribute('href') === '/relief');
    expect(link.className).toMatch(/dash-primary|bg-/);
    const other = screen.getAllByRole('link').find((a) => a.getAttribute('href') === '/donor/my-donations');
    expect(link.className).not.toBe(other.className);
  });

  it.each([
    ['donor', '/donor/relief-pledges', ['/volunteer/relief-tasks', '/admin/relief']],
    ['volunteer', '/volunteer/relief-tasks', ['/donor/relief-pledges', '/admin/relief']],
    ['admin', '/admin/relief', ['/donor/relief-pledges', '/volunteer/relief-tasks']],
  ])('%s sees only their own relief entry (%s)', (role, own, others) => {
    renderSidebar(role);
    expect(hrefs()).toContain(own);
    others.forEach((o) => expect(hrefs()).not.toContain(o));
    expect(hrefs()).toContain('/relief');
  });

  it('only the matching entry is highlighted on a relief page (no double highlight)', () => {
    renderSidebar('donor', '/donor/relief-pledges/41');
    const active = (path) => screen.getAllByRole('link').filter((a) => a.getAttribute('href') === path).map((a) => a.className);
    const mine = active('/donor/relief-pledges')[0];
    const browse = active('/relief')[0];
    expect(mine).not.toBe(browse);
  });
});
