import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bizmuzik.ru'
  return NextResponse.redirect(`${baseUrl}/dashboard`)
}
