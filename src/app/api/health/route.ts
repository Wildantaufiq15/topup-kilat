/**
 * Health Check Endpoint
 *
 * Used by Docker HEALTHCHECK and load balancers
 * Returns 200 OK if the application is running
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
