import { getCurrentInstance, onMounted, onUnmounted, type Ref } from 'vue';

import { calcConnectionOpacity } from '../helpers/calc-connection-opacity.helper';

const CSS_PARTICLE_COUNT = 40;
const CSS_CONNECTION_DISTANCE = 120;
const CSS_DOT_RADIUS = 1.5;
const CSS_BASE_SPEED = 0.6;
const MAX_LINE_OPACITY = 0.25;
const DOT_OPACITY = 0.7;
const PARTICLE_LIFETIME_MS = 6000;
const PARTICLE_FADE_IN_MS = 900;
const PARTICLE_FADE_OUT_MS = 900;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  birth: number;
}

/**
 * Drive a constellation canvas animation: wandering dots that fade in, drift,
 * bounce off edges, and dynamically connect with fading lines whenever they
 * move close enough to form polygon silhouettes. Dots eventually fade out and
 * respawn elsewhere.
 */
export function useConstellationAnimation(
  canvasRef: Ref<HTMLCanvasElement | null>,
) {
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrameId: number | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let themeObserver: MutationObserver | null = null;

  let particles: Particle[] = [];
  let dpr = 1;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let dotColor = 'rgb(200, 200, 212)';
  let lineColor = 'rgb(158, 158, 174)';

  function isReducedMotionPreferred(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function readThemeColors() {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    dotColor =
      styles.getPropertyValue('--color-fg-secondary').trim() || dotColor;
    lineColor = styles.getPropertyValue('--color-fg-muted').trim() || lineColor;
  }

  /* Random initial position and direction are required for the organic
     wandering-dot visual effect; predictability is not a concern here. */
  function createParticle(now: number): Particle {
    // eslint-disable-next-line sonarjs/pseudo-random
    const angle = Math.random() * Math.PI * 2;
    // eslint-disable-next-line sonarjs/pseudo-random
    const speed = (Math.random() * 0.5 + 0.5) * CSS_BASE_SPEED * dpr;

    return {
      // eslint-disable-next-line sonarjs/pseudo-random
      x: Math.random() * canvasWidth,
      // eslint-disable-next-line sonarjs/pseudo-random
      y: Math.random() * canvasHeight,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      birth: now,
    };
  }

  function initParticles(now: number) {
    particles = Array.from({ length: CSS_PARTICLE_COUNT }, () => {
      const particle = createParticle(now);
      // Stagger initial births across the full lifetime so dots fade in and
      // out independently instead of in one synchronized pulse.
      // eslint-disable-next-line sonarjs/pseudo-random
      particle.birth = now - Math.random() * PARTICLE_LIFETIME_MS;
      return particle;
    });
  }

  function fitParticlesToCanvas() {
    for (const particle of particles) {
      particle.x = Math.max(0, Math.min(canvasWidth, particle.x));
      particle.y = Math.max(0, Math.min(canvasHeight, particle.y));
    }
  }

  function resizeCanvas() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvasWidth = Math.max(1, Math.floor(rect.width * dpr));
    canvasHeight = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    fitParticlesToCanvas();
  }

  function updateParticles(now: number) {
    for (const particle of particles) {
      const age = now - particle.birth;

      if (age >= PARTICLE_LIFETIME_MS) {
        Object.assign(particle, createParticle(now));
        continue;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x <= 0 || particle.x >= canvasWidth) {
        particle.vx *= -1;
        particle.x = Math.max(0, Math.min(canvasWidth, particle.x));
      }

      if (particle.y <= 0 || particle.y >= canvasHeight) {
        particle.vy *= -1;
        particle.y = Math.max(0, Math.min(canvasHeight, particle.y));
      }
    }
  }

  function calcParticleOpacity(age: number): number {
    if (age < PARTICLE_FADE_IN_MS) {
      return age / PARTICLE_FADE_IN_MS;
    }
    if (age > PARTICLE_LIFETIME_MS - PARTICLE_FADE_OUT_MS) {
      return (PARTICLE_LIFETIME_MS - age) / PARTICLE_FADE_OUT_MS;
    }
    return 1;
  }

  function drawConnections(now: number) {
    if (!ctx) return;

    const maxDistance = CSS_CONNECTION_DISTANCE * dpr;

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.hypot(dx, dy);

        if (distance >= maxDistance) continue;

        const age1 = now - p1.birth;
        const age2 = now - p2.birth;
        const particleOpacity = Math.min(
          calcParticleOpacity(age1),
          calcParticleOpacity(age2),
        );
        const distanceOpacity = calcConnectionOpacity(distance, maxDistance);
        const opacity = distanceOpacity * particleOpacity * MAX_LINE_OPACITY;

        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 1 * dpr;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  function drawDots(now: number) {
    if (!ctx) return;

    const radius = CSS_DOT_RADIUS * dpr;
    ctx.fillStyle = dotColor;

    for (const particle of particles) {
      const age = now - particle.birth;
      const opacity = calcParticleOpacity(age) * DOT_OPACITY;

      ctx.beginPath();
      ctx.globalAlpha = opacity;
      ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function render() {
    if (!ctx || !canvasRef.value) return;

    const now = performance.now();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    updateParticles(now);
    drawConnections(now);
    drawDots(now);
    ctx.globalAlpha = 1;
  }

  function scheduleFrame() {
    if (isReducedMotionPreferred()) {
      render();
      return;
    }

    animationFrameId = requestAnimationFrame(() => {
      render();
      scheduleFrame();
    });
  }

  function start() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    if (!ctx) return;

    readThemeColors();
    resizeCanvas();
    if (particles.length === 0) {
      initParticles(performance.now());
    }

    scheduleFrame();
  }

  function stop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    resizeObserver?.disconnect();
    resizeObserver = null;

    themeObserver?.disconnect();
    themeObserver = null;
  }

  function observeResize() {
    if (typeof ResizeObserver === 'undefined') return;

    resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      if (isReducedMotionPreferred()) {
        render();
      }
    });

    if (canvasRef.value) {
      resizeObserver.observe(canvasRef.value);
    }
  }

  function observeThemeChanges() {
    if (typeof MutationObserver === 'undefined') return;

    themeObserver = new MutationObserver(() => {
      readThemeColors();
      if (isReducedMotionPreferred()) {
        render();
      }
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-mode'],
    });
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      start();
      observeResize();
      observeThemeChanges();
    });

    onUnmounted(() => {
      stop();
    });
  }

  return { start, stop };
}
