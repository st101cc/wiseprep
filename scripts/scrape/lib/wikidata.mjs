// Minimal Wikidata API client. Wikidata content is CC0 (public domain) and the
// API is explicitly open to programmatic use, so this is a ToS-permitting source.
// Docs: https://www.wikidata.org/w/api.php

const API = 'https://www.wikidata.org/w/api.php'
const UA = 'WisePrep-data-scraper/1.0 (https://github.com/wiseprep; educational MVP)'

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.status === 429) { await sleep(1500 * (attempt + 1)); continue }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      if (attempt === 3) throw e
      await sleep(800 * (attempt + 1))
    }
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Resolve a name to the most likely entity QID. Returns null if nothing found.
export async function searchEntity(name, language = 'en') {
  const d = await api({ action: 'wbsearchentities', search: name, language, uselang: language, type: 'item', limit: '5' })
  return d?.search?.[0]?.id ?? null
}

// Fetch full entities (labels + claims) for up to 50 QIDs per request.
export async function getEntities(qids, languages = ['en', 'zh', 'zh-tw', 'zh-hant']) {
  const out = {}
  const chunks = []
  for (let i = 0; i < qids.length; i += 45) chunks.push(qids.slice(i, i + 45))
  for (const chunk of chunks) {
    const d = await api({
      action: 'wbgetentities',
      ids: chunk.join('|'),
      props: 'labels|claims',
      languages: languages.join('|'),
    })
    Object.assign(out, d?.entities ?? {})
    await sleep(120)
  }
  return out
}

// --- claim helpers -------------------------------------------------------

export function label(entity, langs = ['zh-tw', 'zh-hant', 'zh', 'en']) {
  if (!entity?.labels) return null
  for (const l of langs) if (entity.labels[l]?.value) return entity.labels[l].value
  return null
}

export function claimEntityIds(entity, prop) {
  return (entity?.claims?.[prop] ?? [])
    .map((c) => c?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean)
}

export function claimStrings(entity, prop) {
  return (entity?.claims?.[prop] ?? [])
    .map((c) => c?.mainsnak?.datavalue?.value)
    .filter((v) => typeof v === 'string')
}

export function claimYear(entity, prop) {
  const t = entity?.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value?.time
  if (!t) return null
  const m = /^[+-](\d{4})/.exec(t)
  return m ? Number(m[1]) : null
}

// Wikidata property IDs used by the company scraper.
export const P = {
  industry: 'P452',
  headquarters: 'P159',
  country: 'P17',
  website: 'P856',
  inception: 'P571',
}
