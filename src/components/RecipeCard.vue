<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { RecipeMeta } from '../utils/recipes'
import { coverUrl, generateGradient, formatTime } from '../utils/recipes'

const props = defineProps<{ recipe: RecipeMeta }>()
const router = useRouter()

const imgUrl = computed(() => coverUrl(props.recipe))
const gradient = computed(() => generateGradient(props.recipe.title))
const imgError = ref(false)
</script>

<template>
  <div class="recipe-card card" @click="router.push(`/recipe/${recipe.id}`)">
    <!-- 封面 -->
    <div class="recipe-card__cover">
      <img
        v-if="imgUrl && !imgError"
        :src="imgUrl"
        :alt="recipe.title"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="recipe-card__placeholder" :style="{ background: gradient }">
        <span class="recipe-card__placeholder-text">{{ recipe.title }}</span>
      </div>
    </div>

    <!-- 信息 -->
    <div class="recipe-card__body">
      <h3 class="recipe-card__title">{{ recipe.title }}</h3>
      <div class="recipe-card__meta">
        <span v-if="recipe.time" class="recipe-card__time">⏱ {{ formatTime(recipe.time) }}</span>
        <span v-if="recipe.difficulty" class="recipe-card__diff">{{ recipe.difficulty }}</span>
      </div>
      <div v-if="recipe.tags.length" class="recipe-card__tags">
        <span v-for="tag in recipe.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recipe-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.recipe-card:active {
  transform: scale(0.97);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.recipe-card__cover {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.recipe-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.recipe-card:hover .recipe-card__cover img {
  transform: scale(1.04);
}

.recipe-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.recipe-card__placeholder-text {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.recipe-card__body {
  padding: 12px 14px 14px;
}

.recipe-card__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text);
}

.recipe-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.recipe-card__time,
.recipe-card__diff {
  font-size: 12px;
  color: var(--text-secondary);
}

.recipe-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
