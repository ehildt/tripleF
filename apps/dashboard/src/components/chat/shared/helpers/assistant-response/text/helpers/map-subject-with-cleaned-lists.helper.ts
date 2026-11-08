import { isMeaningfulString } from '../is-meaningful-string.helper';

type FilterArray = <T>(
  value: T[] | undefined,
  predicate: (item: T) => boolean,
) => T[] | undefined;

/** Clean a subject profile's strength/weakness lists. */
export function mapSubjectWithCleanedLists<
  T extends {
    strengths?: Array<{ text?: string }>;
    weaknesses?: Array<{ text?: string }>;
  },
>(subject: T, filterArray: FilterArray) {
  return {
    ...subject,
    strengths: filterArray(subject.strengths, (item) =>
      isMeaningfulString(item.text),
    ),
    weaknesses: filterArray(subject.weaknesses, (item) =>
      isMeaningfulString(item.text),
    ),
  };
}
