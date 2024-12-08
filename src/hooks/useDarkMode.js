import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../storage';

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(storage.getString('darkMode') || 'system');
  const systemColorScheme = useColorScheme();
  
  const isDarkMode = darkMode === 'dark' || (darkMode === 'system' && systemColorScheme === 'dark');

  useEffect(() => {
    const savedDarkMode = storage.getString('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode);
    }
  }, []);

  const setDarkModeValue = (mode) => {
    setDarkMode(mode);
    storage.set('darkMode', mode);
  };

  return {
    darkMode,
    isDarkMode,
    setDarkMode: setDarkModeValue
  };
};
