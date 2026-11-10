import type { LocaleMessages } from '../locale-schema';
import activity from './en/activity';
import app from './en/app';
import capabilities from './en/capabilities';
import chat from './en/chat';
import common from './en/common';
import nav from './en/nav';
import toast from './en/toast';

/** English UI chrome — the source of truth for all other locales. */
export default {
  languageCode: 'en',
  countryCode: 'us',
  app,
  nav,
  common,
  capabilities,
  chat,
  toast,
  activity,
} satisfies LocaleMessages;
