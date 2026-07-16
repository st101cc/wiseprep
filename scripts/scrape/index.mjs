// Orchestrates every available scraper. Run all: `npm run scrape`.
// Individual sources have their own npm scripts (e.g. `npm run scrape:companies`).
//
// Source legality note:
//  - Companies  -> Wikidata (CC0, open API). Fully ToS-permitting.
//  - Roles      -> curated taxonomy in src/data/roles.json (stable; not scraped).
//  - Flows      -> curated in src/data/interview-flows.json. No ToS-permitting
//                  bulk source exists for interview processes; add real ones via
//                  scrape-flows.mjs only from pages you're authorized to use.

import { run as scrapeCompanies } from './scrape-companies.mjs'

const steps = [['companies', scrapeCompanies]]

const only = process.argv[2]
for (const [name, fn] of steps) {
  if (only && only !== name) continue
  console.log(`\n=== scrape: ${name} ===`)
  await fn()
}
console.log('\nDone.')
