import { NextRequest, NextResponse } from 'next/server';
import Negotiator from 'negotiator';
import { match } from '@formatjs/intl-localematcher';

const LOCALES = ['ko', 'en', 'ja'];
const DEFAULT_LOCALE = 'ko';

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const headers = { 'accept-language': acceptLanguage };
  const languages = new Negotiator({ headers }).languages();
  try {
    return match(languages, LOCALES, DEFAULT_LOCALE);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (hasLocale) return NextResponse.next();

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const locale = getLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|favicon|.*\\..*).*)'],
};
