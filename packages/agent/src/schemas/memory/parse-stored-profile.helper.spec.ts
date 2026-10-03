import { describe, expect, it } from 'vitest';

import { parseStoredProfile } from './parse-stored-profile.helper.js';

describe('parseStoredProfile', () => {
  it('returns an empty profile for missing or blank text', () => {
    expect(parseStoredProfile(undefined)).toEqual({});
    expect(parseStoredProfile('')).toEqual({});
    expect(parseStoredProfile('   ')).toEqual({});
  });

  it('returns an empty profile for unparseable text', () => {
    expect(parseStoredProfile('{not json')).toEqual({});
  });

  it('returns an empty profile for non-object JSON', () => {
    expect(parseStoredProfile('"just a string"')).toEqual({});
    expect(parseStoredProfile('[1, 2, 3]')).toEqual({});
    expect(parseStoredProfile('null')).toEqual({});
  });

  it('returns the parsed object when the text holds a profile', () => {
    expect(parseStoredProfile('{"name":"Sam","likes":["jazz"]}')).toEqual({ name: 'Sam', likes: ['jazz'] });
  });
});
