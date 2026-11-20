// node --experimental-strip-types src/lib/markdown.check.ts
import assert from 'node:assert/strict'
import { parseBlocks, parseInline } from './markdown.ts'

const md = `## 履歷定位

你是一位擁有 **LSE 數據科學背景** 的 MLE。
第二行同段落。

---

### 1. 生成式 AI 工程師
* **匹配分數**：\`9.0 / 10\`
* **最強的 2 個對應點**：
  1. 具備多模態 LLM 經驗
     續行屬於同一項
  2. 量化成果
- dash item`

const b = parseBlocks(md)
assert.deepEqual(b.map(x => x.k), ['h', 'p', 'hr', 'h', 'li', 'li', 'li', 'li', 'li'])
assert.deepEqual(b[0], { k: 'h', level: 2, text: '履歷定位' })
assert.equal(b[1].k === 'p' && b[1].text, '你是一位擁有 **LSE 數據科學背景** 的 MLE。\n第二行同段落。')
assert.equal(b[3].k === 'h' && b[3].text, '1. 生成式 AI 工程師', 'numbered heading stays a heading')
assert.deepEqual(b[6], { k: 'li', ordered: true, marker: '1.', indent: 1, text: '具備多模態 LLM 經驗\n續行屬於同一項' })
assert.equal(b[4].k === 'li' && b[4].indent, 0)

assert.deepEqual(parseInline('**匹配分數**：`9.0 / 10` 好'), [
  { t: 'b', v: '匹配分數' }, { t: 'text', v: '：' }, { t: 'code', v: '9.0 / 10' }, { t: 'text', v: ' 好' }])
assert.deepEqual(parseInline('a ** b'), [{ t: 'text', v: 'a ** b' }], 'lone ** stays text')
assert.deepEqual(parseBlocks('***'), [{ k: 'hr' }])
console.log('markdown: ok')
