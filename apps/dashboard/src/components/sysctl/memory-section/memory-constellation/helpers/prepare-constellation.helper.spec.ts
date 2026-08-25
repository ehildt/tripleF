import { describe, expect, it } from 'vitest';

import type {
  ConstellationLink,
  ConstellationNode,
} from '../MemoryConstellation.types';
import { buildRelaxedLayout } from './build-relaxed-layout.helper';
import { clusterNodes } from './cluster-nodes.helper';
import { prepareConstellation } from './prepare-constellation.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

const makeNode = (
  id: string,
  clusterKey: string,
  communityKey?: string,
): ConstellationNode => ({
  id,
  label: id,
  clusterKey,
  text: id,
  keys: [clusterKey],
  communityKey,
});

const makeLink = (
  source: string,
  target: string,
  score: number,
): ConstellationLink => ({ source, target, type: 'semantic', score });

/** Convenience: relax + prepare in one call (the composable splits these). */
const prepare = (
  nodes: readonly ConstellationNode[],
  links: readonly ConstellationLink[],
  collapsedKeys: ReadonlySet<string> = new Set(),
  interLinkMinScore?: number,
) =>
  prepareConstellation(
    nodes,
    buildRelaxedLayout(nodes, links, interLinkMinScore),
    links,
    collapsedKeys,
    interLinkMinScore,
  );

describe('prepareConstellation', () => {
  it('keeps clusters fully expanded and appends the ZERO root', () => {
    const nodes = [
      makeNode('a', 'work'),
      makeNode('b', 'work'),
      makeNode('c', 'hobby'),
    ];
    const result = prepare(nodes, []);

    expect(result.nodeList.map((n) => n.id)).toEqual([
      'a',
      'b',
      'c',
      ROOT_NODE_ID,
    ]);
    expect(result.nodeList.some((n) => n.isCategory)).toBe(false);
    expect(result.nodeList.some((n) => n.isRoot)).toBe(true);
    expect(result.positions.get(ROOT_NODE_ID)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('collapses a cluster whose key is in collapsedKeys', () => {
    const nodes = Array.from({ length: 3 }, (_, i) =>
      makeNode(`n${i}`, 'work'),
    );
    const result = prepare(nodes, [], new Set(['work']));

    expect(result.nodeList.filter((n) => n.isCategory)).toHaveLength(1);
    expect(result.nodeList.find((n) => n.isCategory)?.id).toBe('cluster:work');
    expect(result.nodeList.find((n) => n.isCategory)?.label).toBe('work');
    expect(result.nodeList.find((n) => n.isCategory)?.memberCount).toBe(3);
  });

  it('expands a cluster when its key is not in collapsedKeys', () => {
    const nodes = Array.from({ length: 3 }, (_, i) =>
      makeNode(`n${i}`, 'work'),
    );
    const result = prepare(nodes, []);

    expect(result.nodeList.some((n) => n.isCategory)).toBe(false);
    expect(result.nodeList.filter((n) => !n.isRoot)).toHaveLength(3);
  });

  it('drops inter edges below the interLinkMinScore bar', () => {
    const nodes = [
      makeNode('a', 'x'),
      makeNode('b', 'x'),
      makeNode('c', 'y'),
      makeNode('d', 'y'),
    ];
    const links = [makeLink('b', 'c', 0.55)];

    // Below the default bar (0.7): no inter edge at all.
    expect(
      prepare(nodes, links).linkIndices.filter((l) => l.kind === 'inter'),
    ).toHaveLength(0);
    // A lowered bar lets the same link through.
    const relaxed = prepare(nodes, links, new Set(), 0.5);
    expect(relaxed.linkIndices.filter((l) => l.kind === 'inter')).toHaveLength(
      1,
    );
  });

  it('scales inter edge opacity from faint at the bar to strong at 1', () => {
    const nodes = [
      makeNode('a', 'x'),
      makeNode('b', 'x'),
      makeNode('c', 'y'),
      makeNode('d', 'y'),
    ];
    const result = prepare(nodes, [makeLink('b', 'c', 0.7)]);

    const inter = result.linkIndices.find((l) => l.kind === 'inter');
    expect(inter?.alpha).toBeCloseTo(0.15);
  });

  it('appends one always-visible category hub per category (even a lone one)', () => {
    const nodes = [
      ...Array.from({ length: 3 }, (_, i) => makeNode(`n${i}`, 'nte', 'games')),
      ...Array.from({ length: 3 }, (_, i) =>
        makeNode(`w${i}`, 'wuthering waves', 'games'),
      ),
      makeNode('d0', 'dog', 'pets'),
    ];
    const result = prepare(nodes, []);

    const communityNodes = result.nodeList.filter((n) => n.isCommunity);
    expect(communityNodes.map((n) => n.id).sort()).toEqual([
      'community:games',
      'community:pets',
    ]);
    expect(result.positions.get('community:games')).toBeDefined();
    expect(result.hubIds.has('community:games')).toBe(true);
  });

  it('connects category hubs to the ZERO root', () => {
    const nodes = [
      makeNode('n0', 'nte', 'games'),
      makeNode('d0', 'dog', 'pets'),
    ];
    const result = prepare(nodes, []);

    const root = result.linkIndices.filter((l) => l.kind === 'root');
    expect(root).toHaveLength(2);
    expect(root.every((l) => result.nodeList[l.b].id === ROOT_NODE_ID)).toBe(
      true,
    );
  });

  it('connects related same-category sub-categories with a sibling edge', () => {
    const nodes = [
      makeNode('n0', 'nte', 'games'),
      makeNode('w0', 'wuthering waves', 'games'),
    ];
    const links = [makeLink('n0', 'w0', 0.9)];
    const result = prepare(nodes, links);

    const community = result.linkIndices.filter((l) => l.kind === 'community');
    expect(community).toHaveLength(2); // nte hub + waves hub → games hub
    // The strong same-category link (0.9) is a direct sibling edge.
    expect(result.linkIndices.filter((l) => l.kind === 'sibling')).toHaveLength(
      1,
    );
    expect(result.linkIndices.filter((l) => l.kind === 'inter')).toHaveLength(
      0,
    );
  });

  it('connects each leaf to its main dot (intra edges)', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x'), makeNode('c', 'x')];
    const result = prepare(nodes, []);

    const intra = result.linkIndices.filter((l) => l.kind === 'intra');
    expect(intra).toHaveLength(2);
    // Both intra edges originate from the hub (first member, index 0).
    expect(intra.every((l) => l.a === 0)).toBe(true);
    expect(intra.map((l) => l.b).sort()).toEqual([1, 2]);
  });

  it('emits no intra edges for a collapsed cluster', () => {
    const nodes = Array.from({ length: 3 }, (_, i) =>
      makeNode(`n${i}`, 'work'),
    );
    const result = prepare(nodes, [], new Set(['work']));

    expect(result.linkIndices.filter((l) => l.kind === 'intra')).toHaveLength(
      0,
    );
  });

  it('aggregates cross-cluster links into one inter edge (max score)', () => {
    const nodes = [
      makeNode('a', 'x'),
      makeNode('b', 'x'),
      makeNode('c', 'y'),
      makeNode('d', 'y'),
    ];
    const links = [makeLink('b', 'c', 0.6), makeLink('b', 'd', 0.9)];
    const result = prepare(nodes, links);

    const inter = result.linkIndices.filter((l) => l.kind === 'inter');
    expect(inter).toHaveLength(1);
    expect(inter[0]?.score).toBeCloseTo(0.9);
  });

  it('scales inter edge opacity by score', () => {
    const nodes = [
      makeNode('a', 'x'),
      makeNode('b', 'x'),
      makeNode('c', 'y'),
      makeNode('d', 'y'),
    ];
    const links = [makeLink('b', 'c', 0.9)];
    const result = prepare(nodes, links);

    const inter = result.linkIndices.find((l) => l.kind === 'inter');
    // Lerp across [0.7, 1]: 0.9 sits midway between faint and strong.
    expect(inter?.alpha).toBeCloseTo(0.15 + 0.7 * ((0.9 - 0.7) / 0.3));
  });

  it('uses the category dot as the main dot for a collapsed cluster', () => {
    const nodes = [
      ...Array.from({ length: 3 }, (_, i) => makeNode(`n${i}`, 'work')),
      makeNode('m0', 'hobby'),
      makeNode('m1', 'hobby'),
    ];
    const links = [makeLink('n0', 'm0', 0.8)];
    const result = prepare(nodes, links, new Set(['work']));

    const inter = result.linkIndices.find((l) => l.kind === 'inter');
    expect(inter).toBeDefined();
    const ids = [result.nodeList[inter!.a].id, result.nodeList[inter!.b].id];
    expect(ids).toContain('cluster:work');
  });

  it('auto-collapses leaves that drift too far from their main dot', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x'), makeNode('c', 'x')];
    const clusters = clusterNodes(nodes);
    const relaxedLayout = {
      clusters,
      communities: [],
      positions: new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 40, y: 0, z: 0 }],
        ['c', { x: 200, y: 0, z: 0 }],
      ]),
    };
    const result = prepareConstellation(nodes, relaxedLayout, [], new Set());

    // 'c' is 200 world units from its hub 'a' (> 80) → hidden.
    expect(result.nodeList.map((n) => n.id)).toEqual(['a', 'b', ROOT_NODE_ID]);
  });

  it('centers each cluster fog on its main dot', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x'), makeNode('c', 'x')];
    const links = [makeLink('a', 'b', 0.9)];
    const result = prepare(nodes, links);

    const fog = result.clusterFog.find((f) => f.key === 'x');
    expect(fog?.center).toEqual(result.positions.get('a'));
  });

  it('places a collapsed category dot at its members relaxed centroid', () => {
    const nodes = Array.from({ length: 3 }, (_, i) =>
      makeNode(`n${i}`, 'work'),
    );
    const result = prepare(nodes, [], new Set(['work']));

    const category = result.nodeList.find((n) => n.isCategory);
    const centroid = result.positions.get(category!.id);
    expect(centroid).toBeDefined();
    const fog = result.clusterFog.find((f) => f.key === 'work');
    expect(fog?.center).toEqual(centroid);
  });
});
