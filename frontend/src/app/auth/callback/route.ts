import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/verify-email';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=configuration_error`);
  }

  // Handle explicit error parameters passed from Supabase Auth
  if (error || errorCode) {
    const redirectTarget = new URL(`${requestUrl.origin}/verify-email`);
    if (error) redirectTarget.searchParams.set('error', error);
    if (errorCode) redirectTarget.searchParams.set('error_code', errorCode);
    if (errorDescription) redirectTarget.searchParams.set('error_description', errorDescription);
    return NextResponse.redirect(redirectTarget);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored if called from Server Component context
          }
        },
      },
    });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      const redirectUrl = new URL(`${requestUrl.origin}${next}`);
      redirectUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(redirectUrl);
    } else {
      const redirectUrl = new URL(`${requestUrl.origin}/verify-email`);
      redirectUrl.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fallback if accessed without code or error
  return NextResponse.redirect(`${requestUrl.origin}/verify-email`);
}
