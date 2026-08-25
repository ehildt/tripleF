interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
}

declare module 'markdown-it';

declare module 'd3-force-3d' {
  export interface SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
  }

  export interface SimulationLinkDatum<
    N extends SimulationNodeDatum = SimulationNodeDatum,
  > {
    source: string | number | N;
    target: string | number | N;
    index?: number;
  }

  export interface Force<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>,
  > {
    (alpha: number): void;
    initialize?(nodes: N[], random: () => number, numDimensions: number): void;
  }

  export interface Simulation<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>,
  > {
    force(name: string, force: Force<N, L> | null): this;
    stop(): this;
    tick(iterations?: number): this;
    nodes(): N[];
    nodes(nodes: N[]): this;
  }

  export interface ForceLink<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>,
  > extends Force<N, L> {
    id(accessor: (node: N, i: number, nodes: N[]) => string | number): this;
    distance(
      accessor: number | ((link: L, i: number, links: L[]) => number),
    ): this;
    strength(
      accessor: number | ((link: L, i: number, links: L[]) => number),
    ): this;
    links(links: L[]): this;
  }

  export interface ForceManyBody<N extends SimulationNodeDatum>
    extends Force<N, SimulationLinkDatum<N>> {
    strength(
      accessor: number | ((node: N, i: number, nodes: N[]) => number),
    ): this;
    theta(value: number): this;
    distanceMin(value: number): this;
    distanceMax(value: number): this;
  }

  export interface ForceCollide<N extends SimulationNodeDatum>
    extends Force<N, SimulationLinkDatum<N>> {
    radius(
      accessor: number | ((node: N, i: number, nodes: N[]) => number),
    ): this;
    strength(value: number): this;
    iterations(value: number): this;
  }

  export function forceSimulation<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>,
  >(nodes?: N[], numDimensions?: number): Simulation<N, L>;

  export function forceLink<
    N extends SimulationNodeDatum,
    L extends SimulationLinkDatum<N>,
  >(links?: L[]): ForceLink<N, L>;

  export function forceManyBody<N extends SimulationNodeDatum>(): ForceManyBody<N>;

  export function forceCollide<N extends SimulationNodeDatum>(
    radius?: number | ((node: N, i: number, nodes: N[]) => number),
  ): ForceCollide<N>;
}

declare const __APP_VERSION__: string;

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
