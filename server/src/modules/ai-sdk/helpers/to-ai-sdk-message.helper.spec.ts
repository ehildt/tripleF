import { describe, expect, it } from 'vitest';

import { MEDIA_TYPE } from '../constants/image-media-type.constants.js';

import { toAiSdkMessage } from './to-ai-sdk-message.helper.js';

describe('toAiSdkMessage', () => {
  it('returns a text-only message when no images are provided', () => {
    expect(toAiSdkMessage({ role: 'user', content: 'hello' })).toEqual({
      role: 'user',
      content: 'hello',
    });
  });

  it('returns a multipart message with text and image parts', () => {
    const buffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);

    expect(
      toAiSdkMessage({ role: 'user', content: 'look', images: [buffer] }),
    ).toEqual({
      role: 'user',
      content: [
        { type: 'text', text: 'look' },
        {
          type: 'file',
          data: Buffer.from(buffer).toString('base64'),
          mediaType: MEDIA_TYPE.WEBP,
        },
      ],
    });
  });

  it('omits the text part when content is empty', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff]);

    expect(
      toAiSdkMessage({ role: 'user', content: '', images: [buffer] }),
    ).toEqual({
      role: 'user',
      content: [
        {
          type: 'file',
          data: Buffer.from(buffer).toString('base64'),
          mediaType: MEDIA_TYPE.JPEG,
        },
      ],
    });
  });
});
