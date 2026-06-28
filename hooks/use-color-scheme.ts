import { useSettings } from '@/context/SettingsContext';

export function useColorScheme() {
  return useSettings().colorScheme;
}
