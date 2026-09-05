import { computed, onMounted, onUnmounted, type Ref, ref, watch } from 'vue';

import { attachLabelMeta } from '../helpers/attach-label-meta.helper';
import { buildOrbitCenters } from '../helpers/build-orbit-centers.helper';
import { buildRelaxedLayout } from '../helpers/build-relaxed-layout.helper';
import { computeNodeRadius } from '../helpers/compute-node-radius.helper';
import { computeOverviewRadius } from '../helpers/compute-overview-radius.helper';
import { computeRelaxedCentroid } from '../helpers/compute-relaxed-centroid.helper';
import { computeTopicCollapseRadius } from '../helpers/compute-topic-collapse-radius.helper';
import { computeTopicOpacity } from '../helpers/compute-topic-opacity.helper';
import { computeViewCenter } from '../helpers/compute-view-center.helper';
import { drawLink } from '../helpers/draw-link.helper';
import { drawNode, RING_GAP, RING_SPACING } from '../helpers/draw-node.helper';
import { drawNodeLabel } from '../helpers/draw-node-label.helper';
import { drawTopicFog } from '../helpers/draw-topic-fog.helper';
import { hitTestNode } from '../helpers/hit-test-node.helper';
import { idleYawIncrement } from '../helpers/idle-yaw-increment.helper';
import { interpolateTransitionPosition } from '../helpers/interpolate-transition-position.helper';
import { isPointOnScreen } from '../helpers/is-point-on-screen.helper';
import { mapNodeToProjected } from '../helpers/map-node-to-projected.helper';
import { mapNodeToTopicOpacity } from '../helpers/map-node-to-topic-opacity.helper';
import { prepareConstellation } from '../helpers/prepare-constellation.helper';
import { projectPoint } from '../helpers/project-point.helper';
import type {
  ConstellationClusterSummary,
  ConstellationFriction,
  ConstellationLabelMeta,
  ConstellationLink,
  ConstellationNode,
  ConstellationPosition,
  DotTransition,
  ProjectedPoint,
} from '../MemoryConstellation.types';

/** Expand animation duration (ms). */
const EXPAND_TRANSITION_DURATION = 500;
/** Collapse animation duration (ms) — a quick pull back into the category dot. */
const COLLAPSE_TRANSITION_DURATION = 1000;
/** Zoom (relative to the fit level) below which topics auto-collapse. */
const ZOOM_COLLAPSE_FACTOR = 1.2;
/** Zoom (relative to the fit level) above which in-view topics re-expand. */
const ZOOM_EXPAND_FACTOR = 1.5;
/** Screen margin (px) around the viewport for the in-view expand test. */
const IN_VIEW_MARGIN = 40;

/** View controls wired from the panel header (labels, rotation, reset,
 *  expand/collapse all, inter-link score bar). */
export interface MemoryConstellationControls {
  showLabels: Ref<boolean>;
  /** Hide the weak (suggested/topical) edges — the electricity arcs. */
  showSuggested: Ref<boolean>;
  rotationEnabled: Ref<boolean>;
  resetSignal: Ref<number>;
  /** All-topics-expanded intent — flipped by the toolbar toggle before
   *  `toggleAllSignal` bumps; the engine only reads it to pick the direction. */
  isAllExpanded: Ref<boolean>;
  /** Increment to expand/collapse every topic (per `isAllExpanded`). */
  toggleAllSignal: Ref<number>;
  /** Inter-topic (hub → hub) edges below this cosine score are not drawn. */
  interLinkMinScore: Ref<number>;
}

/**
 * The memory-space canvas engine: a 3D point cloud rendered on a 2D canvas
 * via a perspective projection. Drag to rotate, right-drag to pan, scroll to
 * zoom, hover a dot for its full text, click a dot to select it. Clusters
 * start collapsed (category dots); the user can expand them (persisted per
 * space), and the camera auto-collapses on zoom-out / re-expands in-view
 * topics on zoom-in. Leaves slowly orbit their main dot.
 */
export function useMemoryConstellation(
  nodes: Ref<readonly ConstellationNode[]>,
  links: Ref<readonly ConstellationLink[]>,
  frictions: Ref<readonly ConstellationFriction[]>,
  clusters: Ref<readonly ConstellationClusterSummary[]>,
  labelMeta: Ref<ReadonlyMap<string, ConstellationLabelMeta> | undefined>,
  canvasRef: Ref<HTMLCanvasElement | null>,
  tooltipRef: Ref<HTMLDivElement | null>,
  onNodeClick: ((node: ConstellationNode) => void) | undefined,
  /** Fired whenever the user-expanded set changes so the parent can mirror
   *  its expand-all toggle state. */
  onExpandedStateChange: ((isAllExpanded: boolean) => void) | undefined,
  controls: MemoryConstellationControls,
  storageKey: string | undefined,
) {
  const hoveredNode = ref<ConstellationNode | null>(null);
  const tooltipStyle = ref({ left: '0px', top: '0px' });
  /** Cluster keys the user expanded (persisted per space; empty = collapsed). */
  const expandedTopics = ref<Set<string>>(loadExpandedTopics());
  /** Cluster keys the camera expanded on zoom-in (ephemeral). */
  const autoExpandedTopics = ref<Set<string>>(new Set());
  /**
   * Cluster keys the user explicitly COLLAPSED while zoomed in. The camera's
   * auto-expand help must never fight an explicit click: this set wins, and
   * expires when the zoom leaves the expand band (auto-collapse pass), on
   * bulk expand/collapse, or when the user re-expands the topic.
   */
  const userCollapsedTopics = ref<Set<string>>(new Set());
  /** Clusters animating a collapse — still visible until the animation ends. */
  const pendingCollapse = ref<Set<string>>(new Set());
  /** Per-dot expand/collapse animations (node id → transition). */
  const transitions = new Map<string, DotTransition>();
  /** Refit the camera once the pending collapse animation finishes. */
  let pendingRefit = false;

  // The force pass runs once per data fetch (nodes/links + cutoff only) —
  // expanding or collapsing a topic just re-filters the pre-relaxed
  // positions.
  const relaxedLayout = computed(() =>
    buildRelaxedLayout(
      nodes.value,
      links.value,
      controls.interLinkMinScore.value,
      clusters.value,
    ),
  );

  /** Leaf → hub orbit inputs (hubs and synthetic dots stay still). */
  const orbitCenters = computed(() => buildOrbitCenters(relaxedLayout.value));

  /** Effective collapsed keys: every topic not expanded (user or auto),
   *  minus topics still animating their collapse. */
  const effectiveCollapsed = computed(() => {
    const collapsed = new Set<string>();
    for (const topic of relaxedLayout.value.topics) {
      const key = topic.key;
      // An explicit user collapse beats every other expansion intent.
      if (userCollapsedTopics.value.has(key)) {
        collapsed.add(key);
        continue;
      }
      if (expandedTopics.value.has(key)) continue;
      if (autoExpandedTopics.value.has(key)) continue;
      if (pendingCollapse.value.has(key)) continue;
      collapsed.add(key);
    }
    return collapsed;
  });

  const preparedBase = computed(() =>
    prepareConstellation(
      nodes.value,
      relaxedLayout.value,
      links.value,
      effectiveCollapsed.value,
      controls.interLinkMinScore.value,
      frictions.value,
      controls.showSuggested.value,
    ),
  );

  /** prepared + taxonomy registry metadata attached to the macro-node dots. */
  const prepared = computed(() =>
    attachLabelMeta(preparedBase.value, labelMeta.value),
  );

  // Camera state lives in a plain object (not reactive) — the rAF loop reads
  // it every frame without triggering Vue re-renders.
  const state = {
    yaw: 0.6,
    pitch: 0.4,
    targetYaw: 0.6,
    targetPitch: 0.4,
    zoom: 1,
    targetZoom: 1,
    /** View pan (perspective-projected units) — zoom-to-cursor anchor. */
    panX: 0,
    panY: 0,
    targetPanX: 0,
    targetPanY: 0,
    mouseX: -1,
    mouseY: -1,
    isDragging: false,
    isPanning: false,
    dragStartX: 0,
    dragStartY: 0,
    yawStart: 0,
    pitchStart: 0,
    panXStart: 0,
    panYStart: 0,
    hoverIndex: -1,
    W: 0,
    H: 0,
    dpr: 1,
    /** Last user/data interaction timestamp (ms) — drives idle auto-rotate. */
    lastInteraction: 0,
    /** The fitted "overview" zoom — the zoom-out floor. */
    fitZoomLevel: 1,
  };

  let animFrame = 0;
  let prevFrameTime = 0;
  let resizeObserver: ResizeObserver | null = null;

  function draw() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
      nodeList,
      positions,
      linkIndices,
      linkCounts,
      nodeColor,
      hubIds,
      topicFog,
    } = prepared.value;
    const s = state;
    const cx = s.W / 2;
    const cy = s.H / 2;
    const fov = Math.max(s.W, s.H) * 1.2;
    const time = performance.now() / 1000;
    const deltaSeconds = prevFrameTime === 0 ? 0 : time - prevFrameTime;
    prevFrameTime = time;

    // Auto-rotate (on by default, toggleable): orbit slowly, pausing while the
    // user drags, pans, zooms, grabs, or hovers a dot — resuming shortly after
    // the interaction ends (hovering pauses for as long as the pointer stays
    // on the dot).
    if (controls.rotationEnabled.value) {
      s.targetYaw += idleYawIncrement(
        s.isDragging || s.isPanning,
        s.hoverIndex >= 0,
        s.lastInteraction,
        deltaSeconds,
        performance.now(),
      );
    }

    // Smooth camera interpolation.
    s.yaw += (s.targetYaw - s.yaw) * 0.12;
    s.pitch += (s.targetPitch - s.pitch) * 0.12;
    s.zoom += (s.targetZoom - s.zoom) * 0.12;
    s.panX += (s.targetPanX - s.panX) * 0.12;
    s.panY += (s.targetPanY - s.panY) * 0.12;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(s.dpr, s.dpr);
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, s.W, s.H);

    // Pan-adjusted view center (zoom-to-cursor) + focus anchor (cursor, or
    // the view center when the pointer is off-canvas).
    const { viewCx, viewCy, focusX, focusY } = computeViewCenter(
      s.panX,
      s.panY,
      s.zoom,
      s.mouseX,
      s.mouseY,
      cx,
      cy,
    );

    const nowMs = performance.now();
    const projected = nodeList.map((node) =>
      mapNodeToProjected(
        node,
        positions,
        transitions,
        orbitCenters.value,
        nowMs,
        time,
        viewCx,
        viewCy,
        s.yaw,
        s.pitch,
        fov,
        s.zoom,
      ),
    );

    // Zoom-focus: past the threshold, the topic nearest the cursor stays
    // full and the other dimensions fade toward 0.25 opacity.
    const topicOpacity = computeTopicOpacity(
      nodeList.map((node, i) => mapNodeToTopicOpacity(node, i, projected)),
      focusX,
      focusY,
      s.zoom,
    );

    // Cluster fog: a soft field behind the links/dots making each domain a
    // "dimension" the hub dot sits in.
    drawTopicFog(
      ctx,
      topicFog,
      s.yaw,
      s.pitch,
      fov,
      viewCx,
      viewCy,
      s.zoom,
      topicOpacity,
    );

    for (let i = 0; i < linkIndices.length; i++) {
      const link = linkIndices[i];
      const a = projected[link.a];
      const b = projected[link.b];
      // Cull edges whose both endpoints are off-screen.
      if (
        !isPointOnScreen(a.x, a.y, s.W, s.H) &&
        !isPointOnScreen(b.x, b.y, s.W, s.H)
      ) {
        continue;
      }
      const aOpacity = topicOpacity.get(nodeList[link.a].topicKey) ?? 1;
      const bOpacity = topicOpacity.get(nodeList[link.b].topicKey) ?? 1;
      const aColor = nodeColor.get(nodeList[link.a].id) ?? '#94a3b8';
      const bColor = nodeColor.get(nodeList[link.b].id) ?? '#94a3b8';
      drawLink(
        ctx,
        link,
        projected,
        Math.min(aOpacity, bOpacity),
        aColor,
        bColor,
        time,
        i,
      );
    }

    if (s.mouseX >= 0 && !s.isDragging) {
      s.hoverIndex = hitTestNode(s.mouseX, s.mouseY, projected);
    }

    const maxLinkCount = Math.max(1, ...linkCounts.values());
    drawNodes(
      ctx,
      nodeList,
      projected,
      topicOpacity,
      maxLinkCount,
      time,
      linkCounts,
      nodeColor,
      hubIds,
    );

    if (s.hoverIndex >= 0) {
      const node = nodeList[s.hoverIndex];
      hoveredNode.value = node;
      const tip = tooltipRef.value;
      if (tip) {
        const tipW = tip.offsetWidth;
        const tipH = tip.offsetHeight;
        tooltipStyle.value = {
          left: `${Math.max(4, Math.min(s.mouseX + 16, s.W - tipW - 12))}px`,
          top: `${Math.max(4, Math.min(s.mouseY + 16, s.H - tipH - 12))}px`,
        };
      }
    } else {
      hoveredNode.value = null;
    }

    cleanupTransitions();

    ctx.restore();
    animFrame = requestAnimationFrame(draw);
  }

  /** Draw every visible dot (and its label) for one frame. */
  function drawNodes(
    ctx: CanvasRenderingContext2D,
    nodeList: ConstellationNode[],
    projected: ProjectedPoint[],
    topicOpacity: Map<string, number>,
    maxLinkCount: number,
    time: number,
    linkCounts: Map<string, number>,
    nodeColor: Map<string, string>,
    hubIds: Set<string>,
  ): void {
    for (let i = 0; i < nodeList.length; i++) {
      // Cull dots outside the viewport (with margin).
      if (!isPointOnScreen(projected[i].x, projected[i].y, state.W, state.H)) {
        continue;
      }
      const nodeOpacity = topicOpacity.get(nodeList[i].topicKey) ?? 1;
      drawNode(ctx, {
        index: i,
        projected,
        zoom: state.zoom,
        isHovered: i === state.hoverIndex,
        isHub: hubIds.has(nodeList[i].id),
        linkCount: linkCounts.get(nodeList[i].id) ?? 0,
        maxLinkCount,
        color: nodeColor.get(nodeList[i].id) ?? '#0074d9',
        time,
        isTopic: nodeList[i].isTopic === true,
        isRoot: nodeList[i].isRoot === true,
        memberCount: nodeList[i].memberCount ?? 0,
        opacity: nodeOpacity,
        isFriction: nodeList[i].isFriction === true,
        isSuperseded: nodeList[i].superseded === true,
        icon: nodeList[i].icon,
      });
      if (
        controls.showLabels.value &&
        (nodeList[i].isTopic || hubIds.has(nodeList[i].id)) &&
        !nodeList[i].isRoot
      ) {
        const isHub = hubIds.has(nodeList[i].id);
        const isTopic = nodeList[i].isTopic === true;
        const isMultiLeaf = isTopic && (nodeList[i].memberCount ?? 0) > 1;
        const r = computeNodeRadius(
          linkCounts.get(nodeList[i].id) ?? 0,
          isHub,
          isTopic,
          false,
          projected[i].scale,
          state.zoom,
        );
        // Push the label past the dot edge (and past the rings for a
        // multi-leaf category dot).
        const offsetX = r + (isMultiLeaf ? RING_GAP + RING_SPACING : 0) + 8;
        drawNodeLabel(
          ctx,
          projected[i].x,
          projected[i].y,
          nodeList[i].label,
          nodeColor.get(nodeList[i].id) ?? '#0074d9',
          nodeOpacity,
          offsetX,
        );
      }
    }
  }

  function resize() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const wasZero = state.W === 0 || state.H === 0;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    state.dpr = dpr;
    state.W = rect.width;
    state.H = rect.height;
    // First real size (e.g. the tab became visible) — fit the camera once.
    if (wasZero && state.W > 0 && state.H > 0) fitZoom();
  }

  function fitZoom() {
    const radius = computeOverviewRadius(relaxedLayout.value);
    if (state.W === 0 || state.H === 0) return;
    // All topics shown + 10% padding: the zoom-out floor.
    const fit = Math.min(state.W, state.H) / (radius * 2.2);
    state.zoom = fit;
    state.targetZoom = fit;
    state.fitZoomLevel = fit;
    // Re-centering the scene clears any zoom-to-cursor pan.
    state.panX = 0;
    state.panY = 0;
    state.targetPanX = 0;
    state.targetPanY = 0;
    applySemanticZoom(fit);
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    state.lastInteraction = performance.now();
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const cx = state.W / 2;
    const cy = state.H / 2;
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    const oldZoom = Math.max(state.zoom, 0.03);
    const minZoom = state.fitZoomLevel > 0 ? state.fitZoomLevel : 0.03;
    const newZoom = Math.max(minZoom, Math.min(16, state.targetZoom * factor));
    // Zoom-to-cursor: keep the world point under the pointer fixed by shifting
    // the pan so the same point stays under the cursor at the new zoom.
    const worldX = state.panX + (mx - cx) / oldZoom;
    const worldY = state.panY + (my - cy) / oldZoom;
    state.targetPanX = worldX - (mx - cx) / newZoom;
    state.targetPanY = worldY - (my - cy) / newZoom;
    state.targetZoom = newZoom;
    applySemanticZoom(newZoom);
  }

  /** Collapse on zoom-out / expand in-view topics on zoom-in (hysteresis). */
  function applySemanticZoom(zoom: number): void {
    const fit = state.fitZoomLevel;
    if (fit <= 0) return;
    if (zoom < fit * ZOOM_COLLAPSE_FACTOR) {
      collapseAllForZoom();
    } else if (zoom > fit * ZOOM_EXPAND_FACTOR) {
      expandInViewForZoom(zoom);
    }
  }

  /** Auto-collapse every camera-expanded topic (zoom-out). */
  function collapseAllForZoom(): void {
    const nextAuto = new Set(autoExpandedTopics.value);
    let changed = false;
    for (const key of autoExpandedTopics.value) {
      nextAuto.delete(key);
      startCollapse(key);
      changed = true;
    }
    if (changed) autoExpandedTopics.value = nextAuto;
    // The zoom left the expand band — user collapse-overrides expire here,
    // so the camera's auto-expand help resumes on the next zoom-in.
    if (userCollapsedTopics.value.size > 0)
      userCollapsedTopics.value = new Set();
  }

  /** Re-expand collapsed topics whose main dot is in view (zoom-in). */
  function expandInViewForZoom(zoom: number): void {
    const nextAuto = new Set(autoExpandedTopics.value);
    let changed = false;
    for (const topic of relaxedLayout.value.topics) {
      const key = topic.key;
      if (expandedTopics.value.has(key)) continue;
      if (nextAuto.has(key)) continue;
      if (userCollapsedTopics.value.has(key)) continue;
      if (!isTopicInView(key, zoom)) continue;
      nextAuto.add(key);
      startExpand(key);
      changed = true;
    }
    if (changed) autoExpandedTopics.value = nextAuto;
  }

  /** Whether a topic's main dot projects inside the viewport (with margin). */
  function isTopicInView(key: string, zoom: number): boolean {
    const topic = relaxedLayout.value.topics.find((c) => c.key === key);
    if (!topic) return false;
    const hubPos = relaxedLayout.value.positions.get(topic.memberIds[0]);
    if (!hubPos) return false;
    const fov = Math.max(state.W, state.H) * 1.2;
    const p = projectPoint(
      hubPos,
      state.yaw,
      state.pitch,
      fov,
      state.W / 2,
      state.H / 2,
      zoom,
    );
    return (
      p.x >= -IN_VIEW_MARGIN &&
      p.x <= state.W + IN_VIEW_MARGIN &&
      p.y >= -IN_VIEW_MARGIN &&
      p.y <= state.H + IN_VIEW_MARGIN
    );
  }

  function onMouseMove(event: MouseEvent) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;
    state.mouseX = event.clientX - rect.left;
    state.mouseY = event.clientY - rect.top;
    if (state.isPanning) {
      state.lastInteraction = performance.now();
      const zoom = Math.max(state.zoom, 0.03);
      state.targetPanX =
        state.panXStart - (event.clientX - state.dragStartX) / zoom;
      state.targetPanY =
        state.panYStart - (event.clientY - state.dragStartY) / zoom;
    } else if (state.isDragging) {
      state.lastInteraction = performance.now();
      state.targetYaw =
        state.yawStart + (event.clientX - state.dragStartX) * 0.005;
      state.targetPitch =
        state.pitchStart + (event.clientY - state.dragStartY) * 0.005;
    }
  }

  function onMouseDown(event: MouseEvent) {
    state.lastInteraction = performance.now();
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    if (event.button === 2) {
      // Right button: pan the view (content follows the cursor).
      state.isPanning = true;
      state.panXStart = state.panX;
      state.panYStart = state.panY;
      return;
    }
    if (event.button !== 0) return;
    // Left button: rotate.
    state.isDragging = true;
    state.yawStart = state.yaw;
    state.pitchStart = state.pitch;
  }

  /** Relaxed centroid of a topic — the animation origin/target. */
  function topicCentroid(key: string): ConstellationPosition | undefined {
    const topic = relaxedLayout.value.topics.find((c) => c.key === key);
    if (!topic) return undefined;
    return computeRelaxedCentroid(topic, relaxedLayout.value.positions);
  }

  /** Center the camera on a world position and set the target zoom. */
  function focusOn(position: ConstellationPosition, targetZoom: number): void {
    const fov = Math.max(state.W, state.H) * 1.2;
    const p = projectPoint(
      position,
      state.targetYaw,
      state.targetPitch,
      fov,
      0,
      0,
      1,
    );
    state.targetPanX = p.x;
    state.targetPanY = p.y;
    state.targetZoom = targetZoom;
  }

  /** Zoom in toward the collapsing topics so the animation is visible. */
  function focusOnCollapsingTopics(): void {
    if (state.W === 0 || state.H === 0) return;
    const keys = [...pendingCollapse.value];
    if (keys.length === 0) return;
    let x = 0;
    let y = 0;
    let z = 0;
    let count = 0;
    let maxRadius = 0;
    for (const key of keys) {
      const centroid = topicCentroid(key);
      if (!centroid) continue;
      x += centroid.x;
      y += centroid.y;
      z += centroid.z;
      count += 1;
      maxRadius = Math.max(
        maxRadius,
        computeTopicCollapseRadius(relaxedLayout.value, key),
      );
    }
    if (count === 0) return;
    // Pause auto-rotation so the animation stays centered while it plays.
    state.lastInteraction = performance.now();
    const centroid = { x: x / count, y: y / count, z: z / count };
    const radius = Math.max(maxRadius, 1);
    const targetZoom = Math.min(
      16,
      Math.min(state.W, state.H) / (radius * 0.625),
    );
    focusOn(centroid, targetZoom);
  }

  /** Start the "burst out" animation for a freshly expanded topic. */
  function startExpand(key: string): void {
    const topic = relaxedLayout.value.topics.find((c) => c.key === key);
    if (!topic) return;
    const centroid = topicCentroid(key);
    if (!centroid) return;
    const now = performance.now();
    for (const memberId of topic.memberIds) {
      const end = relaxedLayout.value.positions.get(memberId);
      if (!end) continue;
      transitions.set(memberId, {
        start: centroid,
        end,
        startTime: now,
        duration: EXPAND_TRANSITION_DURATION,
        kind: 'expand',
      });
    }
  }

  /** Start the "pull back in" animation for a topic being collapsed. */
  function startCollapse(key: string): void {
    const topic = relaxedLayout.value.topics.find((c) => c.key === key);
    if (!topic) return;
    const centroid = topicCentroid(key);
    if (!centroid) return;
    const now = performance.now();
    for (const memberId of topic.memberIds) {
      const finalPos = relaxedLayout.value.positions.get(memberId);
      if (!finalPos) continue;
      // Start from the dot's current (possibly mid-expand) position so rapid
      // clicks stay smooth.
      const start = interpolateTransitionPosition(
        transitions.get(memberId),
        finalPos,
        now,
      );
      transitions.set(memberId, {
        start,
        end: centroid,
        startTime: now,
        duration: COLLAPSE_TRANSITION_DURATION,
        kind: 'collapse',
      });
    }
    const next = new Set(pendingCollapse.value);
    next.add(key);
    pendingCollapse.value = next;
  }

  /** Whether a topic is expanded (user or auto), and not user-collapsed. */
  function isExpanded(key: string): boolean {
    return (
      (expandedTopics.value.has(key) || autoExpandedTopics.value.has(key)) &&
      !userCollapsedTopics.value.has(key)
    );
  }

  /** Expand one topic (user intent persists, auto intent is ephemeral). */
  function expandTopic(key: string, userIntent: boolean): void {
    if (userIntent) {
      const nextUser = new Set(expandedTopics.value);
      nextUser.add(key);
      expandedTopics.value = nextUser;
      // An explicit expand lifts the zoom-override for this topic.
      const nextCollapsed = new Set(userCollapsedTopics.value);
      nextCollapsed.delete(key);
      userCollapsedTopics.value = nextCollapsed;
    }
    const nextAuto = new Set(autoExpandedTopics.value);
    nextAuto.delete(key);
    autoExpandedTopics.value = nextAuto;
    startExpand(key);
  }

  /** Collapse one topic (user intent persists, auto intent is ephemeral). */
  function collapseTopic(key: string, userIntent: boolean): void {
    if (userIntent) {
      const nextUser = new Set(expandedTopics.value);
      nextUser.delete(key);
      expandedTopics.value = nextUser;
      // The click happened mid-expand-band: override the camera's auto-expand
      // until the zoom leaves the band (collapseAllForZoom clears it).
      const nextCollapsed = new Set(userCollapsedTopics.value);
      nextCollapsed.add(key);
      userCollapsedTopics.value = nextCollapsed;
    }
    const nextAuto = new Set(autoExpandedTopics.value);
    nextAuto.delete(key);
    autoExpandedTopics.value = nextAuto;
    startCollapse(key);
  }

  /**
   * Animate the collapse of every expanded topic. When `zoomIn` is true
   * (reset), the camera also zooms in toward the collapsing topics so the
   * animation is visible before the post-animation refit.
   */
  function collapseAll(zoomIn = false): void {
    const wasExpanded = new Set(expandedTopics.value);
    for (const key of autoExpandedTopics.value) wasExpanded.add(key);
    expandedTopics.value = new Set();
    autoExpandedTopics.value = new Set();
    userCollapsedTopics.value = new Set();
    for (const key of wasExpanded) startCollapse(key);
    if (zoomIn) focusOnCollapsingTopics();
  }

  /** Expand every topic (with the burst animation). */
  function expandAllTopics(): void {
    const wasCollapsed = new Set(effectiveCollapsed.value);
    for (const key of pendingCollapse.value) wasCollapsed.add(key);
    pendingCollapse.value = new Set();
    expandedTopics.value = new Set(
      relaxedLayout.value.topics.map((topic) => topic.key),
    );
    autoExpandedTopics.value = new Set();
    userCollapsedTopics.value = new Set();
    for (const key of wasCollapsed) startExpand(key);
  }

  /** Remove finished transitions and finalize pending collapses. */
  function cleanupTransitions(): void {
    const nowMs = performance.now();
    for (const [nodeId, t] of transitions) {
      if (nowMs - t.startTime >= t.duration) transitions.delete(nodeId);
    }
    const next = new Set(pendingCollapse.value);
    let changed = false;
    for (const key of pendingCollapse.value) {
      const topic = relaxedLayout.value.topics.find((c) => c.key === key);
      if (!topic) {
        next.delete(key);
        changed = true;
        continue;
      }
      if (topic.memberIds.every((id) => !transitions.has(id))) {
        next.delete(key);
        changed = true;
      }
    }
    if (changed) pendingCollapse.value = next;
    if (pendingCollapse.value.size === 0 && pendingRefit) {
      pendingRefit = false;
      fitZoom();
    }
  }

  function toggleTopic(key: string) {
    if (isExpanded(key)) {
      collapseTopic(key, true);
    } else {
      expandTopic(key, true);
    }
  }

  /**
   * Toggle a cluster hub: expand every collapsed member topic at once,
   * or — when none is collapsed — pull them all back into their category
   * dots.
   */
  function toggleCluster(key: string) {
    const cluster = relaxedLayout.value.clusters.find((c) => c.key === key);
    if (!cluster) return;
    const collapsedMembers = cluster.memberTopicKeys.filter(
      (topicKey) => !isExpanded(topicKey),
    );
    if (collapsedMembers.length > 0) {
      for (const topicKey of collapsedMembers) {
        expandTopic(topicKey, true);
      }
    } else {
      for (const topicKey of cluster.memberTopicKeys) {
        if (isExpanded(topicKey)) collapseTopic(topicKey, true);
      }
    }
  }

  /**
   * Toggle a community hub: expand every collapsed member topic at once,
   * or — when none is collapsed — pull them all back into their category
   * dots.
   */
  function toggleCommunity(key: string) {
    const community = relaxedLayout.value.communities.find(
      (c) => c.key === key,
    );
    if (!community) return;
    const collapsedMembers = community.memberTopicKeys.filter(
      (topicKey) => !isExpanded(topicKey),
    );
    if (collapsedMembers.length > 0) {
      for (const topicKey of collapsedMembers) {
        expandTopic(topicKey, true);
      }
    } else {
      for (const topicKey of community.memberTopicKeys) {
        if (isExpanded(topicKey)) collapseTopic(topicKey, true);
      }
    }
  }

  function onMouseUp() {
    if (state.isPanning) {
      state.isPanning = false;
      state.lastInteraction = performance.now();
      return;
    }
    if (!state.isDragging) return;
    state.lastInteraction = performance.now();
    const dx = Math.abs(state.yaw - state.yawStart);
    const dy = Math.abs(state.pitch - state.pitchStart);
    if (dx < 0.01 && dy < 0.01 && state.hoverIndex >= 0) {
      const node = prepared.value.nodeList[state.hoverIndex];
      // Every dot selects (the metadata column shows its payload); hubs
      // additionally toggle their folded members, the root only selects.
      if (node.isRoot) {
        onNodeClick?.(node);
      } else if (node.isCluster && node.clusterKey) {
        toggleCluster(node.clusterKey);
        onNodeClick?.(node);
      } else if (node.isCommunity && node.communityKey) {
        toggleCommunity(node.communityKey);
        onNodeClick?.(node);
      } else if (node.isTopic) {
        toggleTopic(node.topicKey);
        onNodeClick?.(node);
      } else {
        onNodeClick?.(node);
      }
    }
    state.isDragging = false;
  }

  function onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  function onMouseLeave() {
    state.mouseX = -1;
    state.mouseY = -1;
    state.isDragging = false;
    state.isPanning = false;
    state.hoverIndex = -1;
    hoveredNode.value = null;
  }

  onMounted(() => {
    resize();
    fitZoom();
    animFrame = requestAnimationFrame(draw);
    const canvas = canvasRef.value;
    canvas?.addEventListener('wheel', onWheel, { passive: false });
    canvas?.addEventListener('mousemove', onMouseMove);
    canvas?.addEventListener('mousedown', onMouseDown);
    canvas?.addEventListener('mouseup', onMouseUp);
    canvas?.addEventListener('mouseleave', onMouseLeave);
    canvas?.addEventListener('contextmenu', onContextMenu);
    // The canvas fills its container (width 100%, fluid height), so observing
    // the canvas box covers container resizes, window resizes, and tab
    // switches — no hardcoded pixel dimensions anywhere.
    resizeObserver = new ResizeObserver(resize);
    if (canvas) resizeObserver.observe(canvas);
    // Mirror the persisted expanded state into the parent's toggle.
    onExpandedStateChange?.(isAllExpanded());
  });

  onUnmounted(() => {
    cancelAnimationFrame(animFrame);
    resizeObserver?.disconnect();
    resizeObserver = null;
    const canvas = canvasRef.value;
    canvas?.removeEventListener('wheel', onWheel);
    canvas?.removeEventListener('mousemove', onMouseMove);
    canvas?.removeEventListener('mousedown', onMouseDown);
    canvas?.removeEventListener('mouseup', onMouseUp);
    canvas?.removeEventListener('mouseleave', onMouseLeave);
    canvas?.removeEventListener('contextmenu', onContextMenu);
  });

  // Re-fit the camera when the layer's data arrives (the component mounts
  // empty during the fetch, then the nodes populate). A fresh fetch keeps the
  // user's expanded toggles but clears the camera's auto-expand state, so the
  // fit uses the persisted state and the zoom level re-applies.
  watch([nodes, links], () => {
    autoExpandedTopics.value = new Set();
    pendingCollapse.value = new Set();
    fitZoom();
    onExpandedStateChange?.(isAllExpanded());
  });

  // Persist the user's expanded set and mirror it into the parent's toggle.
  watch(expandedTopics, () => {
    saveExpandedTopics();
    onExpandedStateChange?.(isAllExpanded());
  });

  // Reset action from the panel header: collapse all expanded topics and
  // refit the camera (rotation/pan are left alone — rotation has its own
  // toggle). The refit waits for the collapse animation to finish.
  watch(controls.resetSignal, () => {
    collapseAll(true);
    pendingRefit = true;
  });

  // Expand/collapse-all action from the panel header: flip every topic at
  // once (per the toggle's new state).
  watch(controls.toggleAllSignal, () => {
    if (controls.isAllExpanded.value) expandAllTopics();
    else collapseAll();
  });

  /** Whether every topic is user-expanded (drives the toolbar toggle). */
  function isAllExpanded(): boolean {
    const topics = relaxedLayout.value.topics;
    return (
      topics.length > 0 &&
      topics.every((topic) => expandedTopics.value.has(topic.key))
    );
  }

  function loadExpandedTopics(): Set<string> {
    if (!storageKey) return new Set();
    try {
      const raw = localStorage.getItem(
        `memory-constellation:expanded:${storageKey}`,
      );
      const parsed: unknown = JSON.parse(raw ?? '[]');
      return new Set(
        Array.isArray(parsed)
          ? parsed.filter((key): key is string => typeof key === 'string')
          : [],
      );
    } catch {
      return new Set();
    }
  }

  function saveExpandedTopics(): void {
    if (!storageKey) return;
    try {
      localStorage.setItem(
        `memory-constellation:expanded:${storageKey}`,
        JSON.stringify([...expandedTopics.value]),
      );
    } catch {
      /* ignore */
    }
  }

  return { hoveredNode, tooltipStyle };
}
