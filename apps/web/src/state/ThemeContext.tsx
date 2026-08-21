import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

export type AppTheme = 'dark' | 'white' | 'dark-blue';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('eduforge_theme');
    if (saved === 'dark' || saved === 'white' || saved === 'dark-blue') {
      return saved as AppTheme;
    }
    return 'dark';
  });

  const applyThemeToDOM = (newTheme: AppTheme) => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-white', 'theme-dark-blue', 'dark', 'light');
    root.removeAttribute('data-theme');

    if (newTheme === 'dark') {
      root.classList.add('theme-dark', 'dark');
      root.setAttribute('data-theme', 'dark');
    } else if (newTheme === 'dark-blue') {
      root.classList.add('theme-dark-blue', 'dark');
      root.setAttribute('data-theme', 'dark-blue');
    } else {
      root.classList.add('theme-white', 'light');
      root.setAttribute('data-theme', 'white');
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
    // Also fetch initial setting from backend
    api.getSettings().then(settings => {
      if (settings?.theme) {
        let mapped: AppTheme = 'dark';
        if (settings.theme === 'white' || settings.theme === 'light') mapped = 'white';
        else if (settings.theme === 'dark-blue') mapped = 'dark-blue';
        else if (settings.theme === 'dark') mapped = 'dark';
        
        setThemeState(mapped);
        localStorage.setItem('eduforge_theme', mapped);
        applyThemeToDOM(mapped);
      }
    }).catch(() => {});
  }, []);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('eduforge_theme', newTheme);
    applyThemeToDOM(newTheme);
    
    // Sync with backend
    api.getSettings().then(settings => {
      if (settings) {
        api.updateSettings({ ...settings, theme: newTheme }).catch(() => {});
      }
    }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
