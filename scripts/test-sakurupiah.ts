/**
 * Script untuk fetch payment methods dari Sakurupiah
 * Jalankan: npx tsx scripts/test-sakurupiah.ts
 */

import { getPaymentChannels } from '../src/lib/sakurupiah'

async function main() {
  console.log('Fetching payment channels from Sakurupiah...\n')

  try {
    const channels = await getPaymentChannels()

    console.log(`✅ Found ${channels.length} payment channels:\n`)
    console.log('| Kode | Nama | Tipe | Min | Max | Biaya | Status |')
    console.log('|------|------|------|-----|-----|-------|--------|')

    channels.forEach(ch => {
      console.log(`| ${ch.kode} | ${ch.nama} | ${ch.tipe} | ${ch.minimal} | ${ch.maksimal} | ${ch.biaya} | ${ch.status} |`)
    })

    // Group by tipe
    const direct = channels.filter(c => c.tipe === 'DIRECT')
    const redirect = channels.filter(c => c.tipe === 'REDIRECT')

    console.log('\n📱 DIRECT Methods:', direct.map(c => c.kode).join(', '))
    console.log('🔗 REDIRECT Methods:', redirect.map(c => c.kode).join(', '))

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

main()
