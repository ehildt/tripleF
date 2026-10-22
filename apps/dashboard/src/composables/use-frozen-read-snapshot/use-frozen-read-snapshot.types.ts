import type { Ref } from 'vue';

export interface UseFrozenReadSnapshotOptions<T> {
  /** The list rows currently available to the panel. */
  items: Readonly<Ref<readonly T[]>>;
  /** Stable identity of one row, matching the live read tracker's key. */
  itemKey: (item: T) => string;
  /** Live read check — reflects clicks immediately. */
  isItemRead: (item: T) => boolean;
}
