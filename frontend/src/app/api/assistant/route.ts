import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to consult MARE-Juris Legal Assistant.' },
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

    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:8000');

    if (!backendUrl) {
      return NextResponse.json({ error: 'BACKEND_API_URL or NEXT_PUBLIC_BACKEND_URL is required in production.' }, { status: 500 });
    }

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
