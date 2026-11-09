/** A model-visible media reference carried by harness response events. */
export interface AssistantMediaReference {
  /** URL of the model-visible image or video. */
  url: string;
  /** Optional display title supplied by the response pipeline. */
  title?: string;
}
