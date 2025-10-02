import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Skip non-app routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.[a-zA-Z0-9]+$/)
  ) {
    return NextResponse.next()
  }

  // Require username cookie before allowing artist pages
  if (pathname.startsWith("/artist/")) {
    const hasUser = Boolean(request.cookies.get("suno_username")?.value)
    if (!hasUser) {
      const url = new URL("/", request.url)
      const nextPath = `${pathname}${search || ""}`
      url.searchParams.set("next", nextPath)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api|favicon|public).*)"],
}


