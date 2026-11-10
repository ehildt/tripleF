import type { CommonMessages } from '../../schemas/common.schema';
import chat from './common/chat';
import debug from './common/debug';
import dlq from './common/dlq';
import media from './common/media';
import memory from './common/memory';
import settings from './common/settings';
import shared from './common/shared';

export default {
  ...shared,
  ...chat,
  ...debug,
  ...dlq,
  ...media,
  ...memory,
  ...settings,
} satisfies CommonMessages;
