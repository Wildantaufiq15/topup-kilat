/**
 * Digiflazz Balance API
 *
 * Check Digiflazz account balance (deposit)
 * GET: Fetch current balance
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const requestId = `bal-${Date.now()}`

  try {
    console.log(`[${requestId}] Balance check request`)

    // TODO: Replace with actual Digiflazz API call
    // For now, return mock data

    return NextResponse.json({
      success: true,
      data: {
        deposit: 0,
        formatted: 'Rp 0',
      },
    })
  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check balance' },
      { status: 500 }
    )
  }
}
