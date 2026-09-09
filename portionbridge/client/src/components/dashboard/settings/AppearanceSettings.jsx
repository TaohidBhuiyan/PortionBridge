import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * AppearanceSettings — theme toggle.
 *
 * Extracted out of DonorSettingsPage.jsx (COMING-SOON ELIMINATION pass).
 * Purely a localStorage + DashboardLayout's 'portionbridge:darkmode' event
 * pattern — there's no backend concept of theme at all, so this was
 * already role-agnostic and safe to reuse anywhere DashboardLayout renders.
 */
export function AppearanceSettings() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null && JSON.parse(saved) ? 'dark' : 'light';
  });

  const handleThemeChange = (e) => {
    const value = e.target.value;
    setTheme(value);
    const isDark = value === 'dark';
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    window.dispatchEvent(new CustomEvent('portionbridge:darkmode', { detail: isDark }));
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Moon size={20} className="text-dash-primary" />
        Appearance
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Sun size={20} className={theme === 'light' ? 'text-dash-primary' : 'text-text-secondary'} />
            <div>
              <p className="font-medium text-text-primary">Theme</p>
              <p className="text-sm text-text-secondary">Choose your preferred theme</p>
            </div>
          </div>
          <select
            className="px-4 py-2 border border-border rounded-lg bg-input text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary"
            value={theme}
            onChange={handleThemeChange}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Theme preference is saved to this browser.
        </p>
      </div>
    </div>
  );
}
