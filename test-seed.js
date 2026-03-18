import { seedDemoDreams, getDreams } from './lib/store.js'

async function main() {
  await seedDemoDreams()
  const dreams = await getDreams()
  console.log(`Seeded! Found ${dreams.length} dreams.`)
}

main().catch(console.error)
