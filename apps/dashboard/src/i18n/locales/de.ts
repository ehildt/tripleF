import type { LocaleMessages } from '../locale-schema';
import activity from './de/activity';
import app from './de/app';
import capabilities from './de/capabilities';
import chat from './de/chat';
import common from './de/common';
import nav from './de/nav';
import toast from './de/toast';

/** German UI chrome — follows the English source of truth. */
export default {
  languageCode: 'de',
  countryCode: 'de',
  app,
  nav,
  common,
  capabilities,
  chat,
  toast,
  activity,
} satisfies LocaleMessages;
