import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

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
    const {
      message,
      conversation_id,
      selected_agents,
      generate_combined,
      compare_sources,
      verify_sources,
      document_id,
    } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message payload cannot be empty.' }, { status: 400 });
    }

    const getBackendUrl = (req: Request) => {
      if (process.env.BACKEND_INTERNAL_URL) {
        return process.env.BACKEND_INTERNAL_URL.replace(/\/+$/, '');
      }
      if (process.env.BACKEND_API_URL) {
        return process.env.BACKEND_API_URL.replace(/\/+$/, '');
      }
      if (process.env.NEXT_PUBLIC_BACKEND_URL) {
        return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '');
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
      return 'http://127.0.0.1:8000';
    };
    
    const backendUrl = getBackendUrl(request);

    // Bounded request deadline: 52s max (safely within Vercel's 60s maxDuration limit)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 52000);

    let backendRes: Response;
    try {
      backendRes = await fetch(`${backendUrl}/api/v1/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          conversation_id: conversation_id || null,
          selected_agents: selected_agents || undefined,
          generate_combined: generate_combined !== undefined ? generate_combined : true,
          compare_sources: compare_sources !== undefined ? compare_sources : true,
          verify_sources: verify_sources !== undefined ? verify_sources : false,
          document_id: document_id || null,
        }),
        signal: abortController.signal,
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        console.warn('[ASSISTANT_ROUTE] Upstream fetch aborted after 52s timeout');
        return NextResponse.json(
          { error: 'The legal research consultation timed out while coordinating multiple agents. Please select fewer agents or try again.' },
          { status: 504 }
        );
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    const contentType = backendRes.headers.get('content-type') || '';
    if (backendRes.status === 504) {
      return NextResponse.json(
        { error: 'The backend legal research engine timed out on the gateway (HTTP 504). Please try again with fewer agents.' },
        { status: 504 }
      );
    }

    if (contentType.includes('text/html')) {
      return NextResponse.json(
        { error: `Backend service returned an unexpected HTML status (${backendRes.status}) instead of JSON.` },
        { status: backendRes.status }
      );
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

    try {
      const parsedData = JSON.parse(text);
      return NextResponse.json(parsedData);
    } catch (parseErr) {
      console.error('[ASSISTANT_ROUTE] Failed to parse backend JSON:', parseErr);
      return NextResponse.json(
        { error: 'Invalid response format received from backend.' },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('[ASSISTANT_ROUTE_ERROR]', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred while processing your legal consultation.' },
      { status: 500 }
    );
  }
}
