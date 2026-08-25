import { describe, expect, it } from 'vitest';

import { buildCognitionNodes } from './build-cognition-nodes.helper';

const makeInsight = (
  id: string,
  text: string,
  path?: string,
): { id: string; text: string; path?: string } => ({ id, text, path });

describe('buildCognitionNodes', () => {
  it('does not render the profile hub (it is the diagram source)', () => {
    const nodes = buildCognitionNodes('{"a":1}', []);

    expect(nodes.some((n) => n.id === 'cognition-profile')).toBe(false);
  });

  it('turns each non-empty profile key into its own cluster', () => {
    const nodes = buildCognitionNodes(
      JSON.stringify({ name: 'Sam', likes: ['cars', 'Linux'], empty: '' }),
      [],
    );

    expect(nodes.map((n) => n.id)).toEqual([
      'cognition-profile:name',
      'cognition-profile:likes',
      'cognition-profile:likes:0',
      'cognition-profile:likes:1',
    ]);
    expect(nodes[0].label).toBe('name');
    expect(nodes[0].clusterKey).toBe('name');
    expect(nodes[0].text).toBe('Sam');
    expect(nodes[1].label).toBe('likes');
    expect(nodes[1].clusterKey).toBe('likes');
    expect(nodes[1].text).toBe('2 items: cars, Linux');
    expect(nodes[2].label).toBe('cars');
    expect(nodes[2].clusterKey).toBe('likes');
    expect(nodes[2].text).toBe('cars');
    expect(nodes[3].label).toBe('Linux');
    expect(nodes[3].clusterKey).toBe('likes');
    expect(nodes[3].text).toBe('Linux');
  });

  it('expands object fields into sub-key leafs', () => {
    const nodes = buildCognitionNodes(
      JSON.stringify({
        communication: { style: 'concise', detailLevel: 'high' },
      }),
      [],
    );

    expect(nodes.map((n) => n.id)).toEqual([
      'cognition-profile:communication',
      'cognition-profile:communication.style',
      'cognition-profile:communication.detailLevel',
    ]);
    expect(nodes[0].text).toBe('2 fields: style, detailLevel');
    expect(nodes[1].label).toBe('style');
    expect(nodes[1].clusterKey).toBe('communication');
    expect(nodes[1].text).toBe('concise');
    expect(nodes[2].label).toBe('detailLevel');
    expect(nodes[2].text).toBe('high');
  });

  it('recurses into nested objects', () => {
    const nodes = buildCognitionNodes(
      JSON.stringify({ persona: { name: 'Ari', voice: { tone: 'warm' } } }),
      [],
    );

    expect(nodes.map((n) => n.id)).toEqual([
      'cognition-profile:persona',
      'cognition-profile:persona.name',
      'cognition-profile:persona.voice',
      'cognition-profile:persona.voice.tone',
    ]);
    expect(nodes[0].text).toBe('2 fields: name, voice');
    expect(nodes[2].text).toBe('1 field: tone');
    expect(nodes[3].text).toBe('warm');
  });

  it('never dumps raw JSON in any tooltip', () => {
    const nodes = buildCognitionNodes(
      JSON.stringify({
        prefs: { editor: 'vscode' },
        likes: ['a', 'b'],
      }),
      [],
    );

    for (const node of nodes) {
      expect(node.text.startsWith('{')).toBe(false);
      expect(node.text.startsWith('[')).toBe(false);
      expect(node.summary?.startsWith('{')).toBe(false);
      expect(node.summary?.startsWith('[')).toBe(false);
    }
  });

  it('skips null and empty profile fields', () => {
    const nodes = buildCognitionNodes(
      JSON.stringify({ name: null, goals: [], prefs: {} }),
      [],
    );

    expect(nodes).toEqual([]);
  });

  it('returns only insights when the profile is absent', () => {
    const nodes = buildCognitionNodes(null, [
      makeInsight('insight-0', 'insight', 'likes.cars'),
    ]);

    expect(nodes.map((n) => n.id)).toEqual(['insight-0']);
  });

  it('clusters insights by the top-level path segment', () => {
    const nodes = buildCognitionNodes(null, [
      makeInsight('a', 'a', 'likes.cars'),
      makeInsight('b', 'b', 'likes.music'),
      makeInsight('c', 'c', 'work'),
    ]);

    expect(nodes.map((n) => n.clusterKey)).toEqual(['likes', 'likes', 'work']);
  });

  it('groups pathless insights under the insights cluster', () => {
    const nodes = buildCognitionNodes(null, [makeInsight('a', 'a')]);

    expect(nodes[0].clusterKey).toBe('insights');
  });
});
