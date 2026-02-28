/**
 * 扫描 public/recipes/ 目录，读取每个菜谱的 Front Matter，
 * 生成 public/recipes-index.json 供前端加载。
 *
 * 使用：node scripts/generate-index.js
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const recipesDir = join(__dirname, '../public/recipes')
const outputFile = join(__dirname, '../public/recipes-index.json')

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const meta = {}
  const lines = match[1].split('\n')

  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const rawValue = line.slice(colonIdx + 1).replace(/\s*#.*$/, '').trim()

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      meta[key] = rawValue
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/['"]/g, ''))
        .filter(Boolean)
    } else if (rawValue !== '' && !isNaN(rawValue)) {
      meta[key] = Number(rawValue)
    } else {
      meta[key] = rawValue
    }
  }

  return meta
}

async function generateIndex() {
  let entries
  try {
    entries = await readdir(recipesDir, { withFileTypes: true })
  } catch {
    console.error(`找不到目录：${recipesDir}`)
    process.exit(1)
  }

  const recipes = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const mdPath = join(recipesDir, entry.name, 'index.md')
    try {
      const raw = await readFile(mdPath, 'utf-8')
      const meta = parseFrontMatter(raw)

      recipes.push({
        id: entry.name,
        title: meta.title || entry.name,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        time: meta.time || null,
        difficulty: meta.difficulty || null,
        servings: meta.servings || null,
        cover: meta.cover || null,
      })
    } catch {
      console.warn(`跳过 ${entry.name}：找不到 index.md`)
    }
  }

  await writeFile(outputFile, JSON.stringify(recipes, null, 2), 'utf-8')
  console.log(`✅ 已生成菜谱索引，共 ${recipes.length} 个菜谱`)
  recipes.forEach(r => console.log(`   - ${r.title}`))
}

generateIndex().catch(console.error)
