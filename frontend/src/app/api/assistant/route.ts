import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const cookieStore = cookies();
      const allCookies = cookieStore.getAll().map(c => c.name);
      return NextResponse.json(
        { 
          error: 'Unauthorized. Please sign in to consult MARE-Juris Legal Assistant.',
          diagnostic: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasAuthCookie: allCookies.some(name => name.includes('sb-') && name.includes('-auth-token')),
            allCookies,
            userFound: !!user,
          }
        },
        { status: 401 }
      );
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const body = await request.json();
    const { message, conversation_id } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message payload cannot be empty.' }, { status: 400 });
    }

    const getBackendUrl = (req: Request) => {
      if (process.env.BACKEND_INTERNAL_URL) return process.env.BACKEND_INTERNAL_URL;
      if (process.env.BACKEND_API_URL) return process.env.BACKEND_API_URL;
      if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      return 'http://127.0.0.1:8000';
    };
    
    const backendUrl = getBackendUrl(request);

    const backendRes = await fetch(`${backendUrl}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: message.trim(),
        conversation_id: conversation_id || null,
      }),
    });

    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return NextResponse.json({ error: 'Backend API returned an HTML response instead of JSON.' }, { status: backendRes.status });
    }

    const text = await backendRes.text();
    if (!backendRes.ok) {
      let detail = 'Backend legal assistant unavailable.';
      try {
        const parsed = JSON.parse(text);
        detail = parsed.detail || parsed.error || detail;
      } catch {
        if (text) detail = text.slice(0, 400);
      }
      return NextResponse.json({ error: detail }, { status: backendRes.status });
    }

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error('[ASSISTANT_ROUTE_ERROR]', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your legal consultation.' },
      { status: 500 }
    );
  }
}
