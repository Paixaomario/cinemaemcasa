'use client'
import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { HomeClient } from './HomeClient'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <main className="min-h-screen bg-black">
        <Navbar />
        <HomeClient />
      </main>
    </Suspense>
  )
}