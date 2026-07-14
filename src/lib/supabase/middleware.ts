import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // White-label domain routing: resolve agency from hostname
  const hostname = request.headers.get('host') || ''
  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  const isMainDomain = hostname === appUrl.hostname || hostname === `www.${appUrl.hostname}` || hostname.includes('localhost')

  if (!isMainDomain && !hostname.endsWith('.vercel.app')) {
    // Custom domain — look up agency in DB
    const { data: agency } = await supabase
      .from('agencies')
      .select('id, brand_color, logo_url, name')
      .eq('custom_domain', hostname)
      .single()

    if (agency) {
      supabaseResponse.headers.set('x-agency-id', agency.id)
      supabaseResponse.headers.set('x-agency-color', agency.brand_color || '#6366f1')
      supabaseResponse.headers.set('x-agency-name', agency.name)
    }
  }

  // Auth guard: protect dashboard routes
  const { pathname } = request.nextUrl

  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
