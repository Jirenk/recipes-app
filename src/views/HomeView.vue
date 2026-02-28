<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import RecipeCard from '../components/RecipeCard.vue'
import type { RecipeMeta } from '../utils/recipes'
import { fetchIndex } from '../utils/recipes'

const recipes = ref<RecipeMeta[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const activeTag = ref('')

onMounted(async () => {
  try {
    recipes.value = await fetchIndex()
  } catch (e) {
    error.value = '加载菜谱失败，请检查 recipes-index.json 是否存在'
  } finally {
    loading.value = false
  }
})

const allTags = computed(() => {
  const set = new Set<string>()
  recipes.value.forEach(r => r.tags.forEach(t => set.add(t)))
  return Array.from(set)
})

const filtered = computed(() => {
  let list = recipes.value
  if (activeTag.value) {
    list = list.filter(r => r.tags.includes(activeTag.value))
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  return list
})

function toggleTag(tag: string) {
  activeTag.value = activeTag.value === tag ? '' : tag
}
</script>

<template>
  <div class="home">
    <!-- 顶部标题栏 -->
    <header class="home-header">
      <div class="home-header__inner">
        <h1 class="home-header__title">🍳 私房菜谱</h1>
        <span class="home-header__count">{{ recipes.length }} 道菜</span>
      </div>

      <!-- 搜索框 -->
      <div class="search-bar">
        <span class="search-bar__icon">🔍</span>
        <input
          v-model="searchQuery"
          class="search-bar__input"
          type="search"
          placeholder="搜索菜名或标签…"
        />
        <button v-if="searchQuery" class="search-bar__clear" @click="searchQuery = ''">✕</button>
      </div>

      <!-- 标签过滤 -->
      <div v-if="allTags.length" class="tag-filter">
        <button
          class="tag-filter__item"
          :class="{ active: !activeTag }"
          @click="activeTag = ''"
        >全部</button>
        <button
          v-for="tag in allTags"
          :key="tag"
          class="tag-filter__item"
          :class="{ active: activeTag === tag }"
          @click="toggleTag(tag)"
        >{{ tag }}</button>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="home-main container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中…</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="filtered.length === 0" class="error-state">
        <p>没有找到匹配的菜谱</p>
      </div>

      <!-- 菜谱卡片网格 -->
      <div v-else class="recipe-grid">
        <RecipeCard v-for="recipe in filtered" :key="recipe.id" :recipe="recipe" />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ── 头部 ── */
.home-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(250, 248, 245, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding-top: env(safe-area-inset-top, 0);
}

.home-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px;
}

.home-header__title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}

.home-header__count {
  font-size: 13px;
  color: var(--text-secondary);
}

/* ── 搜索框 ── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 10px;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 0 12px;
  height: 42px;
  transition: border-color var(--transition);
}

.search-bar:focus-within {
  border-color: var(--primary);
}

.search-bar__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.search-bar__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  background: transparent;
  color: var(--text);
}

.search-bar__input::placeholder {
  color: #bbb;
}

.search-bar__clear {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 4px;
}

/* ── 标签筛选 ── */
.tag-filter {
  display: flex;
  gap: 8px;
  padding: 0 16px 10px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tag-filter::-webkit-scrollbar {
  display: none;
}

.tag-filter__item {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 13px;
  border: 1.5px solid var(--border);
  color: var(--text-secondary);
  white-space: nowrap;
  transition: all var(--transition);
  background: var(--card);
}

.tag-filter__item.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 600;
}

/* ── 内容主区 ── */
.home-main {
  padding-top: 16px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0));
}

/* ── 菜谱网格 ── */
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

/* 折叠屏展开（双栏布局）时变为三列 */
@media (min-width: 700px) {
  .recipe-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
