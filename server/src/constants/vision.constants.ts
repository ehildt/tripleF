import { TASK } from '../decorators/constants.js';
import { SupportedToolFunction } from '../dtos/json-rpc/mcp.model.js';

export const VISIONS_ANALYZE = {
  title: 'Vision Analysis',
  name: 'visions.analyze' satisfies SupportedToolFunction,
  description: [
    'Perform a specific visual analysis on provided images based on the selected task:',
    'description, comparison, or optical character recognition (OCR).',
    'Optional preprocessing can enhance image quality for better AI analysis.',
  ].join(' '),
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['requestId', 'model', TASK],
    properties: {
      requestId: {
        type: 'string',
        description: 'Client-provided request correlation identifier',
      },
      roomId: {
        type: 'string',
        description: 'Socket.IO room identifier for routing results',
      },
      stream: {
        type: 'boolean',
        default: false,
        description:
          'When enabled, the server streams partial results via Socket.IO',
      },
      event: {
        type: 'string',
        default: 'vision',
        description: 'Socket.IO event name for receiving real-time results',
      },
      numCtx: {
        type: 'number',
        description: 'Maximum token context available to the model',
      },
      model: {
        type: 'string',
        description: 'The Ollama vision model to use (e.g. llama3.2-vision).',
      },
      images: {
        type: 'array',
        description: [
          'Base64-encoded images for analysis.',
          'Each item is an object with data (base64 string) and mimeType.',
        ].join(' '),
        items: {
          type: 'object',
          properties: {
            data: {
              type: 'string',
              description: 'Base64-encoded image bytes',
            },
            mimeType: {
              type: 'string',
              description: 'Image MIME type (e.g. image/png, image/jpeg)',
            },
            name: {
              type: 'string',
              description: 'Optional filename to associate with the image',
            },
          },
          required: ['data'],
        },
      },
      prompt: {
        type: 'string',
        description: [
          'Optional textual instruction to guide the selected vision task.',
          'For example, provide context or specify what to focus on during analysis.',
        ].join(' '),
      },
      task: {
        type: 'string',
        default: 'describe',
        description: [
          'Specifies which type of analysis to perform.',
          'Only one task is executed per request:',
          '"describe": generates a description of the image content.',
          '"compare": evaluates similarities or differences between images.',
          '"ocr": extracts text content from the images.',
        ].join(' '),
        enum: ['describe', 'compare', 'ocr'],
      },
      preprocessing: {
        type: 'object',
        description: 'Optional image preprocessing for enhanced AI analysis',
        additionalProperties: false,
        properties: {
          enabled: {
            type: 'boolean',
            default: false,
            description: 'Enable image preprocessing with multiple variants',
          },
          resize: {
            type: 'object',
            description: 'Resize options for all variants',
            additionalProperties: false,
            properties: {
              maxWidth: {
                type: 'number',
                default: 768,
                description:
                  'Maximum width in pixels (allowed: 256, 384, 512, 640, 768, 1024)',
                enum: [256, 384, 512, 640, 768, 1024],
              },
              maxHeight: {
                type: 'number',
                description:
                  'Maximum height in pixels (keeps aspect ratio if not set)',
              },
              withoutEnlargement: {
                type: 'boolean',
                default: true,
                description: 'Prevent upscaling images smaller than target',
              },
            },
          },
          variants: {
            type: 'object',
            description: 'Toggle each image variant',
            additionalProperties: false,
            properties: {
              original: {
                type: 'boolean',
                default: true,
                description: 'Resized original image',
              },
              grayscale: {
                type: 'boolean',
                default: true,
                description: 'Grayscale - removes color for luminance focus',
              },
              denoised: {
                type: 'boolean',
                default: true,
                description:
                  'Denoised - Gaussian blur for background smoothing',
              },
              sharpened: {
                type: 'boolean',
                default: false,
                description: 'Sharpened - edge enhancement for clarity',
              },
              clahe: {
                type: 'boolean',
                default: true,
                description: 'CLAHE - adaptive contrast enhancement',
              },
            },
          },
          parameters: {
            type: 'object',
            description: 'Processing parameters with defaults',
            additionalProperties: false,
            properties: {
              blurSigma: {
                type: 'number',
                default: 0.5,
                description: 'Gaussian blur sigma for denoising',
              },
              sharpenSigma: {
                type: 'number',
                default: 1,
                description: 'Sharpen sigma value',
              },
              sharpenM1: {
                type: 'number',
                default: 1,
                description: 'Sharpen flat area level',
              },
              sharpenM2: {
                type: 'number',
                default: 2,
                description: 'Sharpen jagged area level',
              },
              brightnessLevel: {
                type: 'number',
                default: 1.2,
                description: 'Brightness multiplier',
              },
              claheWidth: {
                type: 'number',
                default: 8,
                description: 'CLAHE tile width',
              },
              claheHeight: {
                type: 'number',
                default: 8,
                description: 'CLAHE tile height',
              },
              claheMaxSlope: {
                type: 'number',
                default: 3,
                description: 'CLAHE max slope/contrast limit',
              },
              normalizeLower: {
                type: 'number',
                default: 1,
                description: 'Normalization lower percentile',
              },
              normalizeUpper: {
                type: 'number',
                default: 99,
                description: 'Normalization upper percentile',
              },
            },
          },
        },
      },
    },
  },
} as const;
