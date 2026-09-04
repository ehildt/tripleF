import { onBeforeUnmount, onMounted, type Ref, ref, watch } from 'vue';

import type {
  SynopsisTreeLink,
  SynopsisTreeNode,
} from '../helpers/build-synopsis-layout.helper';
import { lightenHex } from '../helpers/lighten-hex.helper';

/** Zoom envelope (scale bounds for the wheel). */
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.5;
/** Padding around the fitted tree on first render / resize. */
const FIT_PADDING = 48;
/** Pointer-hit reach around a dot (screen px). */
const HIT_RADIUS = 24;
/** Node radius scaling: base dot plus the square root of the member count. */
const NODE_RADIUS_BASE = 6;
const NODE_RADIUS_SCALE = 1.2;
/** Label width cap (screen px) before ellipsis truncation. */
const LABEL_MAX_WIDTH = 160;

interface SynopsisViewState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

/**
 * The synopsis tree canvas: a deterministic banded hierarchy renderer
 * (leaf clusters at the bottom, root at the top, parent links upward) on a
 * 2D canvas. Drag to pan, scroll to zoom, hover a dot for the community
 * summary. No force simulation — the layout comes from
 * `buildSynopsisLayout`, so the scene is static and redraws only on state
 * changes (data, view, hover, resize, theme colors).
 */
export function useSynopsisCanvas(
  nodes: Ref<SynopsisTreeNode[]>,
  links: Ref<SynopsisTreeLink[]>,
  canvasRef: Ref<HTMLCanvasElement | null>,
  tooltipRef: Ref<HTMLDivElement | null>,
  colors: Ref<{ accent: string; muted: string }>,
) {
  const hoveredNode = ref<SynopsisTreeNode | null>(null);
  const tooltipStyle = ref<Record<string, string>>({});
  const view = ref<SynopsisViewState>({ offsetX: 0, offsetY: 0, zoom: 1 });

  let resizeObserver: ResizeObserver | undefined;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;

  /** Per-level tint ladder off the theme accent (leaf = accent). */
  function levelColor(level: number): string {
    return lightenHex(colors.value.accent, Math.min(level * 0.22, 0.66));
  }

  function project(node: SynopsisTreeNode): { x: number; y: number } {
    const canvas = canvasRef.value;
    const rect = canvas?.getBoundingClientRect();
    const { offsetX, offsetY, zoom } = view.value;
    return {
      x: (rect?.width ?? 0) / 2 + offsetX + node.x * zoom,
      y: (rect?.height ?? 0) / 2 + offsetY + node.y * zoom,
    };
  }

  function nodeRadius(node: SynopsisTreeNode): number {
    return (
      (NODE_RADIUS_BASE + Math.sqrt(node.memberCount) * NODE_RADIUS_SCALE) *
      view.value.zoom
    );
  }

  function draw(): void {
    const canvas = canvasRef.value;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const byId = new Map(nodes.value.map((node) => [node.id, node]));
    ctx.lineWidth = 1;
    for (const link of links.value) {
      const from = byId.get(link.fromId);
      const to = byId.get(link.toId);
      if (!from || !to) continue;
      const a = project(from);
      const b = project(to);
      ctx.strokeStyle = colors.value.muted;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.font = '11px sans-serif';
    for (const node of nodes.value) {
      const { x, y } = project(node);
      const radius = Math.max(nodeRadius(node), 3);
      const isHovered = hoveredNode.value?.id === node.id;
      ctx.fillStyle = levelColor(node.level);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      if (isHovered) {
        ctx.strokeStyle = colors.value.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      ctx.fillStyle = colors.value.muted;
      ctx.fillText(node.title, x, y + radius + 14, LABEL_MAX_WIDTH);
    }
  }

  /** Fit the whole tree into the viewport (first paint + resize). */
  function fit(): void {
    const canvas = canvasRef.value;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect || nodes.value.length === 0) return;
    const xs = nodes.value.map((node) => node.x);
    const ys = nodes.value.map((node) => node.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const zoom = Math.min(
      ZOOM_MAX,
      Math.max(
        ZOOM_MIN,
        Math.min(
          (rect.width - FIT_PADDING * 2) / Math.max(width, 1),
          (rect.height - FIT_PADDING * 2) / Math.max(height, 1),
        ),
      ),
    );
    view.value = {
      zoom,
      offsetX: -((Math.max(...xs) + Math.min(...xs)) / 2) * zoom,
      offsetY: -((Math.max(...ys) + Math.min(...ys)) / 2) * zoom,
    };
  }

  function onPointerDown(event: PointerEvent): void {
    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = view.value.offsetX;
    dragOriginY = view.value.offsetY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent): void {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (dragging) {
      view.value = {
        ...view.value,
        offsetX: dragOriginX + (event.clientX - dragStartX),
        offsetY: dragOriginY + (event.clientY - dragStartY),
      };
      draw();
      return;
    }
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let hovered: SynopsisTreeNode | null = null;
    let bestDist = HIT_RADIUS;
    for (const node of nodes.value) {
      const { x, y } = project(node);
      const dist = Math.hypot(mouseX - x, mouseY - y);
      if (dist < bestDist) {
        bestDist = dist;
        hovered = node;
      }
    }
    const changed = hovered?.id !== hoveredNode.value?.id;
    hoveredNode.value = hovered;
    tooltipStyle.value = hovered
      ? { left: `${mouseX + 12}px`, top: `${mouseY + 12}px` }
      : {};
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
    if (changed) draw();
  }

  function onPointerUp(): void {
    dragging = false;
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const factor = event.deltaY > 0 ? 1 / 1.1 : 1.1;
    const zoom = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, view.value.zoom * factor),
    );
    // Zoom around the cursor: keep the world point under the pointer fixed.
    const cx = rect.width / 2 + view.value.offsetX;
    const cy = rect.height / 2 + view.value.offsetY;
    view.value = {
      zoom,
      offsetX:
        mouseX - rect.width / 2 - ((mouseX - cx) / view.value.zoom) * zoom,
      offsetY:
        mouseY - rect.height / 2 - ((mouseY - cy) / view.value.zoom) * zoom,
    };
    draw();
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    resizeObserver = new ResizeObserver(() => {
      fit();
      draw();
    });
    resizeObserver.observe(canvas);
    fit();
    draw();
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
  });

  watch([nodes, links, colors], () => {
    fit();
    draw();
  });
  watch(hoveredNode, draw);

  return {
    hoveredNode,
    tooltipStyle,
    draw,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
  };
}
