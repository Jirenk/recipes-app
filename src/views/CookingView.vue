<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchRecipeMarkdown, extractSteps } from '../utils/recipes'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const steps = ref<{ title: string; body: string }[]>([])
const currentIdx = ref(0)
const loading = ref(true)
const error = ref('')

let wakeLock: WakeLockSentinel | null = null

onMounted(async () => {
  try {
    const raw = await fetchRecipeMarkdown(id)
    steps.value = extractSteps(raw)
  } catch {
    error.value = '加载失败'
  } finally {
    loading.value = false
  }

  // 申请屏幕常亮
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen')
    }
  } catch {
    // 屏幕常亮不支持或被拒绝，静默失败
  }
})

onUnmounted(() => {
  wakeLock?.release()
})

const current = computed(() => steps.value[currentIdx.value])
const total = computed(() => steps.value.length)
const progress = computed(() => total.value ? ((currentIdx.value + 1) / total.value) * 100 : 0)

function prev() {
  if (currentIdx.value > 0) currentIdx.value--
}

function next() {
  if (currentIdx.value < total.value - 1) currentIdx.value++
}

// 支持左右滑动翻步骤
let touchStartX = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 50) {
    if (dx < 0) next()
    else prev()
  }
}
</script>

<template>
  <div
    class="cooking-page"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- 退出按钮 -->
    <button class="cooking-exit" @click="router.back()">✕</button>

    <div v-if="loading" class="cooking-loading">
      <div class="cooking-spinner"></div>
    </div>

    <div v-else-if="error" class="cooking-error">
      <p>{{ error }}</p>
      <button @click="router.back()">返回</button>
    </div>

    <template v-else-if="current">
      <!-- 顶部进度条 -->
      <div class="cooking-progress-bar">
        <div class="cooking-progress-bar__fill" :style="{ width: progress + '%' }"></div>
      </div>

      <!-- 步骤计数 -->
      <div class="cooking-counter">第 {{ currentIdx + 1 }} 步 / 共 {{ total }} 步</div>

      <!-- 步骤内容 -->
      <div class="cooking-content">
        <h2 class="cooking-step-title">{{ current.title }}</h2>
        <p class="cooking-step-body" v-html="current.body.replace(/\n/g, '<br>')"></p>
      </div>

      <!-- 底部导航 -->
      <div class="cooking-nav">
        <button
          class="cooking-nav__btn"
          :class="{ disabled: currentIdx === 0 }"
          :disabled="currentIdx === 0"
          @click="prev"
        >
          ← 上一步
        </button>

        <div class="cooking-nav__dots">
          <span
            v-for="(_, i) in steps"
            :key="i"
            class="cooking-nav__dot"
            :class="{ active: i === currentIdx }"
          ></span>
        </div>

        <button
          class="cooking-nav__btn"
          :class="{ disabled: currentIdx === total - 1 }"
          :disabled="currentIdx === total - 1"
          @click="next"
        >
          下一步 →
        </button>
      </div>

      <!-- 最后一步完成提示 -->
      <div v-if="currentIdx === total - 1" class="cooking-done">
        🎉 全部步骤完成，开动吧！
      </div>
    </template>
  </div>
</template>

<style scoped>
.cooking-page {
  position: fixed;
  inset: 0;
  background: #111111;
  color: #F5F5F0;
  display: flex;
  flex-direction: column;
  padding: env(safe-area-inset-top, 20px) 0 env(safe-area-inset-bottom, 0);
  user-select: none;
}

/* ── 退出 ── */
.cooking-exit {
  position: absolute;
  top: calc(env(safe-area-inset-top, 16px) + 8px);
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #F5F5F0;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.15s ease;
}

.cooking-exit:active {
  background: rgba(255, 255, 255, 0.22);
}

/* ── 进度条 ── */
.cooking-progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.cooking-progress-bar__fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
}

/* ── 计数 ── */
.cooking-counter {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  padding: 14px 0 8px;
  letter-spacing: 0.5px;
}

/* ── 步骤内容 ── */
.cooking-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px 28px;
  overflow-y: auto;
}

.cooking-step-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 20px;
  line-height: 1.4;
}

.cooking-step-body {
  font-size: 19px;
  line-height: 1.9;
  color: #E8E8E0;
  white-space: pre-wrap;
}

/* ── 底部导航 ── */
.cooking-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 20px;
  gap: 12px;
}

.cooking-nav__btn {
  padding: 14px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #F5F5F0;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.15s ease;
  flex: 0 0 auto;
}

.cooking-nav__btn:active:not(.disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.cooking-nav__btn.disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.cooking-nav__dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  flex: 1;
}

.cooking-nav__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.2s ease;
}

.cooking-nav__dot.active {
  background: var(--primary);
  transform: scale(1.3);
}

/* ── 完成提示 ── */
.cooking-done {
  text-align: center;
  font-size: 17px;
  color: #FFD700;
  padding: 0 20px 8px;
}

/* ── 加载/错误 ── */
.cooking-loading,
.cooking-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.cooking-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
