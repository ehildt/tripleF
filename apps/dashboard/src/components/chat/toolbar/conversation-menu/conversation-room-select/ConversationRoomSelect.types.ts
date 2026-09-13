export interface ConversationRoomSelectProps {
  /** Currently selected room/channel. */
  modelValue: string;
  /** Rooms available on the chosen socket event. */
  options: readonly string[];
}
