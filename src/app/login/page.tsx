'use client'

import { redirect } from 'next/navigation'

export default function LoginRedirect() {
  // Temporarily remove login: redirect users to home
  redirect('/')
}
