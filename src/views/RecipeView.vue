<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import type { RecipeMeta } from '../utils/recipes'
import { fetchIndex, fetchRecipeMarkdown, coverUrl, videoUrl, generateGradient, formatTime } from '../utils/recipes'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const meta = ref<RecipeMeta | null>(null)
const htmlContent = ref('')
const loading = ref(true)
const error = ref('')

const BASE = import.meta.env.BASE_URL

onMounted(async () => {
  try {
    const [index, raw] = await Promise.all([fetchIndex(), fetchRecipeMarkdown(id)])

    meta.value = index.find(r => r.id === id) ?? {
      id,
      title: id,
      tags: [],
      time: null,
      difficulty: null,
      servings: null,
      cover: null,
      video: null,
    }

    // 自定义图片 URL，将相对路径转为 public 资源路径
    const md = new MarkdownIt({ html: false, linkify: true })

    const defaultImgRender =
      md.renderer.rules.image ||
      function (tokens: any[], idx: number, options: any, _: any, self: any) {
        return self.renderToken(tokens, idx, options)
      }

    md.renderer.rules.image = function (tokens: any[], idx: number, options: any, env: any, self: any) {
      const token = tokens[idx]
      const srcIdx = token.attrIndex('src')
      const src: string = token.attrs[srcIdx][1]
      if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        token.attrs[srcIdx][1] = `${BASE}recipes/${id}/${src}`
      }
      return defaultImgRender(tokens, idx, options, env, self)
    }

    htmlContent.value = md.render(raw)
  } catch (e) {
    error.value = '加载失败，请返回重试'
  } finally {
    loading.value = false
  }
})

const imgUrl = computed(() => meta.value ? coverUrl(meta.value) : null)
const vidUrl = computed(() => meta.value ? videoUrl(meta.value) : null)
const gradient = computed(() => meta.value ? generateGradient(meta.value.title) : '')
const imgError = ref(false)
</script>

<template>
  <div class="recipe-page">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <div class="top-bar-inner">
        <button class="back-btn" @click="router.back()">←</button>
        <span class="top-bar-title">{{ meta?.title ?? '菜谱' }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中…</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="router.back()">返回</button>
    </div>

    <template v-else-if="meta">
      <!-- 封面 Hero -->
      <div class="recipe-hero">
        <img v-if="imgUrl && !imgError" :src="imgUrl" :alt="meta.title" class="recipe-hero__img" @error="imgError = true" />
        <div v-else class="recipe-hero__gradient" :style="{ background: gradient }">
          <span class="recipe-hero__name">{{ meta.title }}</span>
        </div>
        <div class="recipe-hero__overlay"></div>
      </div>

      <div class="container recipe-body">
        <!-- 做菜视频 -->
        <div v-if="vidUrl" class="recipe-video card">
          <h2 class="recipe-video__title">做菜视频</h2>
          <video
            class="recipe-video__player"
            controls
            playsinline
            preload="metadata"
            :src="vidUrl"
          ></video>
        </div>

        <!-- 菜谱基本信息 -->
        <div class="recipe-info card">
          <h1 class="recipe-info__title">{{ meta.title }}</h1>
          <div class="recipe-info__stats">
            <div v-if="meta.time" class="stat">
              <span class="stat__icon">⏱</span>
              <span class="stat__label">{{ formatTime(meta.time) }}</span>
            </div>
            <div v-if="meta.difficulty" class="stat">
              <span class="stat__icon">📊</span>
              <span class="stat__label">{{ meta.difficulty }}</span>
            </div>
            <div v-if="meta.servings" class="stat">
              <span class="stat__icon">👥</span>
              <span class="stat__label">{{ meta.servings }} 人份</span>
            </div>
          </div>
          <div v-if="meta.tags.length" class="recipe-info__tags">
            <span v-for="tag in meta.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Markdown 正文 -->
        <div class="recipe-content card md-content" v-html="htmlContent"></div>
      </div>

      <!-- 做菜模式悬浮按钮 -->
      <button class="fab" @click="router.push(`/recipe/${id}/cook`)">
        <span class="fab__icon">👨‍🍳</span>
        <span class="fab__text">开始做菜</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.recipe-page {
  min-height: 100vh;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
}

/* ── Hero 封面 ── */
.recipe-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.recipe-hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-hero__gradient {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recipe-hero__name {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.recipe-hero__overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, var(--bg));
}

/* ── 内容区 ── */
.recipe-body {
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── 基本信息卡片 ── */
.recipe-info {
  padding: 18px;
}

.recipe-info__title {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 12px;
}

.recipe-info__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat__icon {
  font-size: 16px;
}

.stat__label {
  font-size: 14px;
  color: var(--text-secondary);
}

.recipe-info__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ── 视频卡片 ── */
.recipe-video {
  padding: 18px;
}

.recipe-video__title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 12px;
}

.recipe-video__player {
  width: 100%;
  border-radius: 10px;
  background: #000;
}

/* ── 正文卡片 ── */
.recipe-content {
  padding: 18px;
}

/* ── 悬浮按钮 ── */
.fab {
  position: fixed;
  right: 20px;
  bottom: calc(24px + env(safe-area-inset-bottom, 0));
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 22px;
  background: var(--primary);
  color: #fff;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4px 20px rgba(232, 99, 75, 0.45);
  z-index: 90;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fab:active {
  transform: scale(0.95);
  box-shadow: 0 2px 10px rgba(232, 99, 75, 0.35);
}

.fab__icon {
  font-size: 20px;
}

.btn-primary {
  padding: 12px 28px;
  background: var(--primary);
  color: #fff;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
}

/* 展开屏宽屏布局 */
@media (min-width: 700px) {
  .recipe-hero {
    aspect-ratio: 21 / 9;
  }

  .recipe-body {
    flex-direction: row;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .recipe-info {
    flex: 0 0 280px;
    position: sticky;
    top: 70px;
  }

  .recipe-video {
    flex: 0 0 100%;
  }

  .recipe-content {
    flex: 1;
  }
}
</style>
