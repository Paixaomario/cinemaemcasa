import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simulação simplificada de Rate Limiting para ambiente Edge
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Acesso seguro ao IP via headers para evitar erros de tipo no build da Vercel
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1'
    const now = Date.now()
    const limit = 100 // 100 requisições
    const windowMs = 60 * 60 * 1000 // por hora

    const userData = rateLimitMap.get(ip) ?? { count: 0, lastReset: now }

    if (now - userData.lastReset > windowMs) {
      userData.count = 0
      userData.lastReset = now
    }

    if (userData.count >= limit) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }

    userData.count++
    rateLimitMap.set(ip, userData)
  }
  return NextResponse.next()
}