import { z } from 'zod';

export const appSchema = z.object({
  navigation: z.string(),
  toggleTabMenu: z.string(),
  switchTheme: z.string(),
  switchToLightMode: z.string(),
  switchToDarkMode: z.string(),
  selectLanguage: z.string(),
});

export type AppMessages = z.infer<typeof appSchema>;
