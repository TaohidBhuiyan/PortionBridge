import { useState } from 'react';
import { Moon, Sun, Monitor, Check, Sparkles, Paintbrush } from 'lucide-react';
import toast from 'react-hot-toast';

const THEMES = [
  {
    id: 'light',
    name: 'Light Theme',
    desc: 'Clean, bright interface optimized for daylight',
    icon: Sun,
    previewBg: 'bg-slate-100',
    previewCard: 'bg-white border-slate-200 shadow-xs',
    previewText: 'text-slate-800',
  },
  {
    id: 'dark',
    name: 'Dark Theme',
    desc: 'Sleek dark mode easy on the eyes in low light',
    icon: Moon,
    previewBg: 'bg-slate-950',
    previewCard: 'bg-slate-900 border-slate-800 shadow-xs',
    previewText: 'text-slate-100',
  },
  {
    id: 'system',
    name: 'System Default',
    desc: 'Automatically matches your device OS preference',
    icon: Monitor,
    previewBg: 'bg-gradient-to-r from-slate-100 to-slate-950',
    previewCard: 'bg-slate-800/80 backdrop-blur-md border-slate-700 shadow-xs',
    previewText: 'text-white',
  },
];

export function AppearanceSettings() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null && JSON.parse(saved) ? 'dark' : 'light';
  });

  const selectTheme = (themeId) => {
    let isDark = false;
    if (themeId === 'dark') {
      isDark = true;
    } else if (themeId === 'light') {
      isDark = false;
    } else if (themeId === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setTheme(themeId);
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    window.dispatchEvent(new CustomEvent('portionbridge:darkmode', { detail: isDark }));
    toast.success(`Theme switched to ${THEMES.find(t => t.id === themeId)?.name || 'selected theme'}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-dash-primary-soft text-dash-primary rounded-xl">
            <Paintbrush size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Appearance & Workspace Theme</h2>
            <p className="text-xs text-text-secondary mt-0.5">Customize your visual interface and display preferences</p>
          </div>
        </div>
      </div>

      {/* Theme Cards Grid */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Sparkles size={18} className="text-dash-primary" />
          Color Theme Mode
        </h3>
        <p className="text-xs text-text-secondary mb-6">
          Changes apply instantly and are saved for your current browser device.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEMES.map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <div
                key={item.id}
                onClick={() => selectTheme(item.id)}
                className={`cursor-pointer rounded-2xl border-2 transition-all overflow-hidden flex flex-col justify-between group ${
                  isSelected
                    ? 'border-dash-primary bg-dash-primary-soft/30 shadow-md ring-2 ring-dash-primary/20'
                    : 'border-border hover:border-dash-primary/40 bg-page/40 hover:bg-page'
                }`}
              >
                {/* Visual Preview Box */}
                <div className={`p-4 h-28 ${item.previewBg} flex flex-col justify-between relative overflow-hidden transition-transform group-hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-white/20 backdrop-blur-md text-white">
                      <Icon size={16} />
                    </span>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-dash-primary text-white flex items-center justify-center shadow-sm">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  {/* Dummy Miniature Dashboard UI snippet */}
                  <div className={`p-2.5 rounded-lg ${item.previewCard} flex items-center gap-2`}>
                    <div className="w-3 h-3 rounded-full bg-dash-primary shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className={`h-1.5 w-16 rounded ${item.previewText} bg-current opacity-80`} />
                      <div className={`h-1 w-10 rounded ${item.previewText} bg-current opacity-40`} />
                    </div>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-surface">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      {item.name}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className={isSelected ? 'text-dash-primary font-semibold' : 'text-text-muted'}>
                      {isSelected ? 'Currently Active' : 'Click to select'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

