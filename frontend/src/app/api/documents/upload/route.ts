import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to upload documents.' },
        { status: 401 }
      );
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No valid file provided.' }, { status: 400 });
    }

    const getBackendUrl = () => {
      if (process.env.BACKEND_INTERNAL_URL) {
        return process.env.BACKEND_INTERNAL_URL.replace(/\/+$/, '');
      }
      if (process.env.BACKEND_API_URL) {
        return process.env.BACKEND_API_URL.replace(/\/+$/, '');
      }
      if (process.env.NEXT_PUBLIC_BACKEND_URL) {
        return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '');
      }
      return 'http://127.0.0.1:8000';
    };

    const backendUrl = getBackendUrl();
    const backendFormData = new FormData();
    backendFormData.append('file', file, (file as any).name || 'document.pdf');

    const backendRes = await fetch(`${backendUrl}/api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    const text = await backendRes.text();
    if (!backendRes.ok) {
      let detail = 'Document upload and parsing failed.';
      try {
        const parsed = JSON.parse(text);
        detail = parsed.detail || parsed.error || detail;
      } catch {
        if (text) detail = text.slice(0, 300);
      }
      return NextResponse.json({ error: detail }, { status: backendRes.status });
    }

    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error('[DOCUMENT_UPLOAD_ROUTE_ERROR]', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred during document upload.' },
      { status: 500 }
    );
  }
}
