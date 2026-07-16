// Maps free-text Wikidata labels onto WisePrep's controlled vocabularies.
// Returns null when nothing matches confidently, so the caller can fall back
// to the curated seed value rather than guessing.

const INDUSTRY_RULES = [
  ['semiconductor', /semiconductor|integrated circuit|foundry|fabless|wafer|\bIC\b|chipmaker/i],
  ['ai', /artificial intelligence|machine learning|deep learning|\bAI\b/i],
  ['fintech', /financial|fintech|\bbank|cryptocurrency|crypto|payment|insurance/i],
  ['ecommerce', /e-?commerce|electronic commerce|online shop|online retail|online market|retail/i],
  ['hardware', /computer hardware|consumer electronics|electronics manufactur|hardware|electronics industry|original design manufacturer|electric vehicle|motor/i],
  ['software', /software|internet|information technology|\bIT services|web|telecommunic|video game|technology company/i],
]

export function mapIndustry(labels) {
  const text = labels.filter(Boolean).join(' ; ')
  for (const [industry, re] of INDUSTRY_RULES) if (re.test(text)) return industry
  return null
}

// Taiwan locality keywords -> canonical zh display name.
const CITY_RULES = [
  ['台北', /台北|臺北|taipei/i],
  ['新北', /新北|new taipei/i],
  ['桃園', /桃園|taoyuan/i],
  ['新竹', /新竹|hsinchu/i],
  ['苗栗', /苗栗|miaoli/i],
  ['台中', /台中|臺中|taichung/i],
  ['台南', /台南|臺南|tainan/i],
  ['高雄', /高雄|kaohsiung/i],
  ['宜蘭', /宜蘭|yilan/i],
]

export function mapCities(labels) {
  const text = labels.filter(Boolean).join(' ; ')
  const found = []
  for (const [city, re] of CITY_RULES) if (re.test(text)) found.push(city)
  return found
}
