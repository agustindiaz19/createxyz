import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme modes the app supports
// 'auto' follows OS setting; 'light' and 'dark' force the scheme
const STORAGE_KEY = 'recipunto.theme.mode';

const ThemeContext = createContext({
  mode: 'auto',
  isDark: false,
  setMode: (_mode) => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('auto');

  // Load persisted mode
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
          setMode(saved);
        }
      } catch (e) {
        // ignore read errors
      }
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, mode);
      } catch (e) {
        // ignore write errors
      }
    })();
  }, [mode]);

  const isDark = useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return systemScheme === 'dark';
  }, [mode, systemScheme]);

  const value = useMemo(() => ({ mode, isDark, setMode }), [mode, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
