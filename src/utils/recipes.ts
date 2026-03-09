export interface RecipeMeta {
  id: string
  title: string
  tags: string[]
  time: number | null
  difficulty: string | null
  servings: number | null
  cover: string | null
  video: string | null
}

export interface RecipeStep {
  title: string
  body: string
}

const BASE = import.meta.env.BASE_URL

export async function fetchIndex(): Promise<RecipeMeta[]> {
  const res = await fetch(`${BASE}recipes-index.json`)
  if (!res.ok) throw new Error('无法加载菜谱索引')
  return res.json()
}

export async function fetchRecipeMarkdown(id: string): Promise<string> {
  const res = await fetch(`${BASE}recipes/${id}/index.md`)
  if (!res.ok) throw new Error(`无法加载菜谱：${id}`)
  return res.text()
}

export function coverUrl(recipe: RecipeMeta): string | null {
  if (!recipe.cover) return null
  return `${BASE}recipes/${recipe.id}/${recipe.cover}`
}

export function videoUrl(recipe: RecipeMeta): string | null {
  if (!recipe.video) return null
  return `${BASE}recipes/${recipe.id}/${recipe.video}`
}

/** 解析 markdown 中的 ### 级标题，每个标题+正文作为一个步骤 */
export function extractSteps(markdown: string): RecipeStep[] {
  const content = markdown.replace(/^---[\s\S]*?---\r?\n?/, '').trim()

  const parts = content.split(/\n(?=### )/)
  const steps: RecipeStep[] = []

  for (const part of parts) {
    const m = part.match(/^### (.+)\r?\n([\s\S]*)$/)
    if (m) {
      steps.push({ title: m[1].trim(), body: m[2].trim() })
    }
  }

  if (steps.length > 0) return steps

  // 降级：按 ## 级标题分割
  const sections = content.split(/\n(?=## )/)
  for (const section of sections) {
    const m = section.match(/^## (.+)\r?\n([\s\S]*)$/)
    if (m) {
      steps.push({ title: m[1].trim(), body: m[2].trim() })
    }
  }

  if (steps.length > 0) return steps

  // 最终降级：全文作为一个步骤
  return [{ title: '菜谱全文', body: content }]
}

/** 根据菜谱名字生成一个暖色渐变（无封面图时使用） */
export function generateGradient(title: string): string {
  const palettes = [
    ['#FF8C69', '#FF6B35'],
    ['#FFB347', '#FF8C00'],
    ['#87CEEB', '#4682B4'],
    ['#98D8AA', '#5BAD6F'],
    ['#DDA0DD', '#9370DB'],
    ['#F4A460', '#D2691E'],
    ['#20B2AA', '#008B8B'],
    ['#FF69B4', '#C71585'],
  ]
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % palettes.length
  const [c1, c2] = palettes[idx]
  return `linear-gradient(135deg, ${c1}, ${c2})`
}

export function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`
}
