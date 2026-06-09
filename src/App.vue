<template>
  <div class="page">
    <div class="card">
      <h1>Эллипс</h1>

      <svg
        ref="svgRef"
        class="scene"
        :viewBox="`0 0 ${core.width} ${core.height}`"
        @pointermove="onPointerMove"
        @pointerup="stopDrag"
        @pointercancel="stopDrag"
        @pointerleave="stopDrag"
      >
        <rect
          :x="0"
          :y="core.coreTop"
          :width="core.width"
          :height="core.coreBottom - core.coreTop"
          class="core"
        />

        <line
          :x1="0"
          :y1="core.coreAxisY"
          :x2="core.width"
          :y2="core.coreAxisY"
          class="axis"
        />

        <rect
          :x="bbox.minX"
          :y="bbox.minY"
          :width="bbox.maxX - bbox.minX"
          :height="bbox.maxY - bbox.minY"
          class="bbox"
        />

        <ellipse
          :cx="ellipse.cx"
          :cy="ellipse.cy"
          :rx="ellipse.a"
          :ry="ellipse.b"
          :transform="`rotate(${ellipse.theta} ${ellipse.cx} ${ellipse.cy})`"
          class="ellipse"
        />

        <line
          :x1="ellipse.cx"
          :y1="ellipse.cy"
          :x2="majorAxisEnd.x"
          :y2="majorAxisEnd.y"
          class="major-axis"
        />

        <circle
          :cx="majorAxisEnd.x"
          :cy="majorAxisEnd.y"
          r="4.5"
          class="major-axis-end"
        />

        <circle
          :cx="ellipse.cx"
          :cy="ellipse.cy"
          r="8"
          class="handle center"
          @pointerdown="startDrag($event, 'center')"
        />

        <circle
          :cx="apex.x"
          :cy="apex.y"
          r="8"
          class="handle apex"
          @pointerdown="startDrag($event, 'apex')"
        />

        <text :x="ellipse.cx + 10" :y="ellipse.cy - 10" class="label">
          center
        </text>
        <text :x="apex.x + 10" :y="apex.y - 10" class="label">
          apex
        </text>
        <text
          :x="majorAxisEnd.x + 10"
          :y="majorAxisEnd.y + 16"
          class="label"
        >
          major axis end
        </text>
      </svg>

      <div class="stats">
        <div><strong>cx:</strong> {{ fmt(ellipse.cx) }}</div>
        <div><strong>cy:</strong> {{ fmt(ellipse.cy) }}</div>
        <div><strong>a:</strong> {{ fmt(ellipse.a) }}</div>
        <div><strong>b:</strong> {{ fmt(ellipse.b) }}</div>
        <div>
          <strong>theta:</strong> {{ fmt(norm180(ellipse.theta)) }}°
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { core } from './constants/ellipse';
import type { DragMode, EllipseModel } from './types/ellipse';
import {
  solveEllipseFromApex,
  getApex,
  getBoundingBox,
  getMajorAxisEnd,
  setCenterByPointer,
} from './utils/ellipseGeometry';
import { fmt, norm180 } from './utils/math';
import { getLocalPoint } from './utils/svg';

const svgRef = ref<SVGSVGElement | null>(null);
const dragMode = ref<DragMode>(null);

const ellipse = reactive<EllipseModel>({
  cx: 300,
  cy: 110,
  a: 100,
  b: 50,
  theta: 45,
});

const apex = computed(() => getApex(ellipse));
const majorAxisEnd = computed(() => getMajorAxisEnd(ellipse));
const bbox = computed(() => getBoundingBox(ellipse));

function startDrag(event: PointerEvent, mode: DragMode): void {
  dragMode.value = mode;
  (event.target as Element).setPointerCapture?.(event.pointerId);
}

function stopDrag(): void {
  dragMode.value = null;
}

function onPointerMove(event: PointerEvent): void {
  if (!dragMode.value) {
    return;
  }

  const point = getLocalPoint(event, svgRef.value, core);

  if (dragMode.value === 'center') {
    setCenterByPointer(ellipse, point, core);
    return;
  }

  if (dragMode.value === 'apex') {
    solveEllipseFromApex(ellipse, point, core);
  }
}
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: Inter, Arial, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  width: min(980px, 100%);
  background: #111827;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 20px;
}

h1 {
  margin: 0 0 16px;
  font-size: 20px;
  line-height: 1.2;
}

.scene {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
  border: 1px solid #334155;
  background: linear-gradient(180deg, #0b1220, #111827);
  touch-action: none;
  user-select: none;
}

.core {
  fill: #dbc29a;
  stroke: #8f6b3e;
  stroke-width: 2;
}

.axis {
  stroke: rgba(15, 23, 42, 0.55);
  stroke-width: 1.5;
  stroke-dasharray: 6 6;
}

.bbox {
  fill: rgba(59, 130, 246, 0.08);
  stroke: rgba(96, 165, 250, 0.65);
  stroke-width: 1;
  stroke-dasharray: 5 5;
}

.ellipse {
  fill: rgba(244, 63, 94, 0.18);
  stroke: #fb7185;
  stroke-width: 3;
}

.major-axis {
  stroke: #22c55e;
  stroke-width: 2;
  stroke-dasharray: 8 4;
}

.major-axis-end {
  fill: #22c55e;
  stroke: #052e16;
  stroke-width: 2;
}

.handle {
  stroke: #fff;
  stroke-width: 2;
  cursor: grab;
}

.handle:active {
  cursor: grabbing;
}

.center {
  fill: #2563eb;
}

.apex {
  fill: #f59e0b;
}

.label {
  fill: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
}

.stats {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.stats > div {
  background: #0b1220;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
}

.legend {
  margin-top: 14px;
  font-size: 14px;
  color: #cbd5e1;
}

.legend p {
  margin: 6px 0 0;
}

@media (max-width: 720px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
