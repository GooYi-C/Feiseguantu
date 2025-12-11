<template>
  <div class="image-uploader">
    <!-- 上传区域 -->
    <div
      class="upload-zone"
      :class="{ dragging, 'has-image': !!previewUrl }"
      @click="openFilePicker"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="handleDrop"
    >
      <template v-if="!previewUrl">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>点击或拖拽上传图片</span>
        <span class="hint">支持 JPG、PNG、WebP</span>
      </template>
      <template v-else>
        <img :src="previewUrl" alt="预览" class="preview-img" :class="{ circle: defaultShape === 'circle' }" />
        <div class="preview-overlay">
          <span>点击更换图片</span>
        </div>
      </template>
    </div>
    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleFileSelect" />

    <!-- 裁剪弹窗 -->
    <Teleport to="body">
      <div v-if="showCropper" class="cropper-modal" @click.self="cancelCrop">
        <div class="cropper-dialog">
          <div class="cropper-header">
            <h3><i class="fas fa-crop-alt"></i> 裁剪图片</h3>
            <button type="button" class="close-btn" @click="cancelCrop">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="cropper-body">
            <!-- Canvas 预览区域 -->
            <div ref="containerRef" class="canvas-container" @wheel.prevent="handleWheel" @mousedown="startDrag">
              <canvas ref="canvasRef"></canvas>
              <!-- 裁剪框 -->
              <div class="crop-frame" :class="defaultShape" :style="cropFrameStyle">
                <div v-if="defaultShape === 'circle'" class="circle-mask"></div>
              </div>
            </div>

            <!-- 工具栏 -->
            <div class="cropper-tools">
              <div class="tool-group">
                <span class="tool-label">缩放 (滚轮)</span>
                <div class="zoom-control">
                  <button type="button" title="缩小" @click="zoomOut">
                    <i class="fas fa-search-minus"></i>
                  </button>
                  <span class="zoom-value">{{ Math.round(scale * 100) }}%</span>
                  <button type="button" title="放大" @click="zoomIn">
                    <i class="fas fa-search-plus"></i>
                  </button>
                  <button type="button" title="重置" @click="resetView">
                    <i class="fas fa-expand"></i>
                  </button>
                </div>
              </div>

              <div class="tool-group">
                <span class="tool-label">输出尺寸</span>
                <select v-model.number="outputSize">
                  <option :value="256">256px</option>
                  <option :value="400">400px</option>
                  <option :value="512">512px</option>
                  <option :value="800">800px</option>
                </select>
              </div>

              <div class="tool-group">
                <span class="tool-label">质量</span>
                <select v-model.number="quality">
                  <option :value="0.7">普通</option>
                  <option :value="0.85">高质量</option>
                  <option :value="0.95">最佳</option>
                </select>
              </div>
            </div>
          </div>

          <div class="cropper-footer">
            <button type="button" class="btn-cancel" @click="cancelCrop">取消</button>
            <button type="button" class="btn-confirm" @click="confirmCrop">
              <i class="fas fa-check"></i> 确认裁剪
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    defaultOutputSize?: number;
    defaultShape?: 'circle' | 'square' | 'portrait';
    defaultQuality?: number;
  }>(),
  {
    defaultOutputSize: 512,
    defaultShape: 'circle',
    defaultQuality: 0.85,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'upload', dataUrl: string): void;
}>();

// DOM Refs
const fileInput = ref<HTMLInputElement>();
const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLElement>();

// State
const previewUrl = ref(props.modelValue || '');
const dragging = ref(false);
const showCropper = ref(false);
const outputSize = ref(props.defaultOutputSize);
const quality = ref(props.defaultQuality);

// 图片状态
const sourceImage = ref<HTMLImageElement | null>(null);
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const lastOffset = ref({ x: 0, y: 0 });

// Canvas 尺寸
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 320;

// 裁剪框尺寸
const cropFrameSize = computed(() => {
  if (props.defaultShape === 'portrait') {
    return { width: 180, height: 240 };
  }
  return { width: 180, height: 180 };
});

const cropFrameStyle = computed(() => ({
  width: cropFrameSize.value.width + 'px',
  height: cropFrameSize.value.height + 'px',
  left: (CANVAS_WIDTH - cropFrameSize.value.width) / 2 + 'px',
  top: (CANVAS_HEIGHT - cropFrameSize.value.height) / 2 + 'px',
}));

// 监听 modelValue
watch(
  () => props.modelValue,
  val => {
    if (val) previewUrl.value = val;
  },
);

function openFilePicker() {
  fileInput.value?.click();
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) processFile(file);
  if (fileInput.value) fileInput.value.value = '';
}

function handleDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
}

function processFile(file: File) {
  if (!file.type.startsWith('image/')) {
    toastr.warning('请上传图片文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      sourceImage.value = img;
      showCropper.value = true;

      // 自动计算初始缩放，使图片能覆盖裁剪框（使用 1.2 倍余量）
      nextTick(() => {
        scale.value = getMinScale() * 1.2;
        offset.value = { x: 0, y: 0 };
        drawCanvas();
      });
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

// 边缘吸附：确保图片始终覆盖裁剪框，避免黑边
function clampOffset() {
  if (!sourceImage.value) return;

  const img = sourceImage.value;
  const scaledW = img.naturalWidth * scale.value;
  const scaledH = img.naturalHeight * scale.value;

  const cropW = cropFrameSize.value.width;
  const cropH = cropFrameSize.value.height;

  // 裁剪框在画布中心
  const cropLeft = (CANVAS_WIDTH - cropW) / 2;
  const cropTop = (CANVAS_HEIGHT - cropH) / 2;
  const cropRight = cropLeft + cropW;
  const cropBottom = cropTop + cropH;

  // 图片中心在画布中心 + offset
  const imgCenterX = CANVAS_WIDTH / 2 + offset.value.x;
  const imgCenterY = CANVAS_HEIGHT / 2 + offset.value.y;

  // 图片边界
  const imgLeft = imgCenterX - scaledW / 2;
  const imgTop = imgCenterY - scaledH / 2;
  const imgRight = imgCenterX + scaledW / 2;
  const imgBottom = imgCenterY + scaledH / 2;

  // 计算需要的最小偏移修正
  let dx = 0;
  let dy = 0;

  // 水平方向：确保图片覆盖裁剪框
  if (imgLeft > cropLeft) {
    dx = cropLeft - imgLeft; // 图片需要左移
  } else if (imgRight < cropRight) {
    dx = cropRight - imgRight; // 图片需要右移
  }

  // 垂直方向：确保图片覆盖裁剪框
  if (imgTop > cropTop) {
    dy = cropTop - imgTop; // 图片需要上移
  } else if (imgBottom < cropBottom) {
    dy = cropBottom - imgBottom; // 图片需要下移
  }

  // 应用修正
  if (dx !== 0 || dy !== 0) {
    offset.value = {
      x: offset.value.x + dx,
      y: offset.value.y + dy,
    };
  }
}

// 确保缩放后图片仍能覆盖裁剪框
function getMinScale(): number {
  if (!sourceImage.value) return 0.1;
  const img = sourceImage.value;
  const cropW = cropFrameSize.value.width;
  const cropH = cropFrameSize.value.height;
  const scaleX = cropW / img.naturalWidth;
  const scaleY = cropH / img.naturalHeight;
  return Math.max(scaleX, scaleY);
}

function drawCanvas() {
  if (!canvasRef.value || !sourceImage.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // 清空画布
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 计算图片绘制位置
  const img = sourceImage.value;
  const scaledW = img.naturalWidth * scale.value;
  const scaledH = img.naturalHeight * scale.value;
  const drawX = (CANVAS_WIDTH - scaledW) / 2 + offset.value.x;
  const drawY = (CANVAS_HEIGHT - scaledH) / 2 + offset.value.y;

  ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
}

function handleWheel(e: WheelEvent) {
  // 减小步长，使缩放更精细
  const delta = e.deltaY > 0 ? -0.03 : 0.03;
  const minScale = getMinScale();
  const newScale = Math.max(minScale, Math.min(5, scale.value + delta));
  scale.value = newScale;
  clampOffset(); // 边缘吸附
  drawCanvas();
}

function zoomIn() {
  scale.value = Math.min(5, scale.value + 0.1);
  clampOffset(); // 边缘吸附
  drawCanvas();
}

function zoomOut() {
  const minScale = getMinScale();
  scale.value = Math.max(minScale, scale.value - 0.1);
  clampOffset(); // 边缘吸附
  drawCanvas();
}

function resetView() {
  if (!sourceImage.value) return;
  // 重置为刚好覆盖裁剪框的最小缩放 * 1.2
  scale.value = getMinScale() * 1.2;
  offset.value = { x: 0, y: 0 };
  drawCanvas();
}

function startDrag(e: MouseEvent) {
  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  lastOffset.value = { ...offset.value };

  const onMove = (me: MouseEvent) => {
    if (!isDragging.value) return;
    offset.value = {
      x: lastOffset.value.x + (me.clientX - dragStart.value.x),
      y: lastOffset.value.y + (me.clientY - dragStart.value.y),
    };
    clampOffset(); // 边缘吸附
    drawCanvas();
  };

  const onUp = () => {
    isDragging.value = false;
    clampOffset(); // 释放时再次确保边缘吸附
    drawCanvas();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function confirmCrop() {
  if (!sourceImage.value) return;

  const img = sourceImage.value;
  const cropW = cropFrameSize.value.width;
  const cropH = cropFrameSize.value.height;

  // 裁剪框在画布上的位置
  const cropX = (CANVAS_WIDTH - cropW) / 2;
  const cropY = (CANVAS_HEIGHT - cropH) / 2;

  // 图片在画布上的位置
  const scaledW = img.naturalWidth * scale.value;
  const scaledH = img.naturalHeight * scale.value;
  const imgX = (CANVAS_WIDTH - scaledW) / 2 + offset.value.x;
  const imgY = (CANVAS_HEIGHT - scaledH) / 2 + offset.value.y;

  // 计算裁剪区域在原图上的坐标
  const srcX = (cropX - imgX) / scale.value;
  const srcY = (cropY - imgY) / scale.value;
  const srcW = cropW / scale.value;
  const srcH = cropH / scale.value;

  // 创建输出 canvas
  const outW = outputSize.value;
  const outH = props.defaultShape === 'portrait' ? Math.round((outputSize.value * 4) / 3) : outputSize.value;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const ctx = outCanvas.getContext('2d')!;

  // 圆形裁剪
  if (props.defaultShape === 'circle') {
    ctx.beginPath();
    ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

  const dataUrl = outCanvas.toDataURL('image/jpeg', quality.value);

  previewUrl.value = dataUrl;
  emit('update:modelValue', dataUrl);
  emit('upload', dataUrl);

  closeCropper();
  toastr.success('图片已处理');
}

function cancelCrop() {
  closeCropper();
}

function closeCropper() {
  showCropper.value = false;
  sourceImage.value = null;
}

onUnmounted(() => {
  sourceImage.value = null;
});
</script>

<style lang="scss" scoped>
.image-uploader {
  width: 100%;
}

// ═══ 上传区域 ═══
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  background: var(--color-bg-elevated);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 120px;

  &:hover {
    border-color: var(--color-gold);
    background: rgba(216, 166, 87, 0.05);
  }

  &.dragging {
    border-color: var(--color-gold);
    background: rgba(216, 166, 87, 0.1);
    transform: scale(1.02);
  }

  &.has-image {
    padding: var(--spacing-sm);
    position: relative;

    &:hover .preview-overlay {
      opacity: 1;
    }
  }

  > i {
    font-size: 32px;
    color: var(--color-text-muted);
  }

  > span {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .hint {
    font-size: 11px;
    color: var(--color-text-muted);
  }
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--radius-md);

  &.circle {
    border-radius: 50%;
  }
}

.preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-lg);
  opacity: 0;
  transition: opacity var(--transition-fast);

  span {
    color: white;
    font-size: 14px;
    font-weight: 500;
  }
}

// ═══ 裁剪弹窗 ═══
.cropper-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  z-index: 99999;
}

.cropper-dialog {
  width: 500px;
  max-width: 95vw;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);

  h3 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;

    i {
      color: var(--color-gold);
    }
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;

    &:hover {
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
    }
  }
}

.cropper-body {
  padding: var(--spacing-lg);
}

// Canvas 容器
.canvas-container {
  position: relative;
  width: 400px;
  height: 320px;
  margin: 0 auto var(--spacing-lg);
  background: #1a1a1a;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: move;

  canvas {
    display: block;
  }
}

// 裁剪框
.crop-frame {
  position: absolute;
  border: 2px solid var(--color-gold);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;

  &.circle {
    border-radius: 50%;
  }

  &.portrait {
    border-radius: var(--radius-md);
  }

  &.square {
    border-radius: var(--radius-md);
  }
}

// ═══ 工具栏 ═══
.cropper-tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.tool-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    cursor: pointer;

    &:hover {
      border-color: var(--color-gold);
      color: var(--color-gold);
    }
  }

  .zoom-value {
    font-size: 12px;
    color: var(--color-text-secondary);
    min-width: 50px;
    text-align: center;
  }
}

.tool-group select {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
}

// ═══ 底部按钮 ═══
.cropper-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.btn-cancel {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

.btn-confirm {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gold);
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg-dark);
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
  }
}
</style>
