'use client';
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    try { const dark = localStorage.getItem('blog-theme') === 'dark'; setIsDark(dark); document.documentElement.classList.toggle('dark', dark); } catch {}
  }, []);
  function toggleTheme() {
    const next = !isDark; setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('blog-theme', next ? 'dark' : 'light'); } catch {}
  }
  return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
