#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').replace(/^"/, '').replace(/"$/, '')
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apiKey = process.env.DREAMSCAPE_API_KEY
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (!apiKey) {
  console.error('Missing DREAMSCAPE_API_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function regenerateVisionImages() {
  console.log('Fetching all shared visions...')
  
  const { data: visions, error } = await supabase
    .from('shared_visions')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching visions:', error)
    process.exit(1)
  }
  
  if (!visions || visions.length === 0) {
    console.log('No visions found')
    process.exit(0)
  }
  
  console.log(`Found ${visions.length} visions. Regenerating images...\n`)
  
  for (const vision of visions) {
    try {
      console.log(`Regenerating image for: "${vision.title}"`)
      
      // Extract the full extraction object from vision_data
      const visionData = vision.vision_data || {}
      const extraction = visionData.extraction || {}
      
      // Call the image generation API
      const response = await fetch(`${apiUrl}/api/visions/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          extraction,
          model: 'dall-e-3',
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`  ✗ Failed (${response.status}): ${errorText}`)
        continue
      }
      
      const result = await response.json()
      
      if (!result.ok || !result.imageUrl) {
        console.error(`  ✗ Failed: ${result.error || 'No image URL returned'}`)
        continue
      }
      
      // Update the vision with the new image URL
      const { error: updateError } = await supabase
        .from('shared_visions')
        .update({ board_image: result.imageUrl })
        .eq('id', vision.id)
      
      if (updateError) {
        console.error(`  ✗ Failed to update: ${updateError.message}`)
        continue
      }
      
      console.log(`  ✓ Image regenerated and saved`)
      console.log(`    Prompt: ${result.prompt.substring(0, 80)}...`)
      console.log(`    Cached: ${result.cached ? 'yes' : 'no'}\n`)
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}\n`)
    }
  }
  
  console.log('Done!')
}

regenerateVisionImages().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
