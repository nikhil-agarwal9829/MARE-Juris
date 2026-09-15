import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      prompt,
      query,
      intent,
      answers,
      matrix,
      profile,
      asked_question_ids,
      asked_count,
    } = body;

    const userQuery = query || prompt;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (action === 'history') {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data, error } = await supabase
        .from('compliance_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ status: 'success', history: data });
    }

    if (action === 'save') {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized. Please sign in to save.' }, { status: 401 });
      }
      if (!intent || !matrix) {
        return NextResponse.json({ error: 'Missing assessment data' }, { status: 400 });
      }

      const title =
        profile?.request ||
        intent.subject ||
        intent.business_name_or_desc ||
        'Compliance assessment';
      const location =
        profile?.location ||
        intent.jurisdiction ||
        intent.city ||
        'India';

      const { data, error } = await supabase
        .from('compliance_assessments')
        .insert([
          {
            user_id: user.id,
            business_desc: title,
            intent: { ...intent, final_profile: profile || null },
            compliance_matrix: matrix,
          },
        ])
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ status: 'success', saved: data[0] });
    }

    if (action === 'start') {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/compliance/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userQuery }),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
        const errorData = await res.text();
        console.error('[COMPLIANCE_API] Start analyze failed:', errorData);
        let detail = 'Backend failed to analyze query.';
        try {
          const parsed = JSON.parse(errorData);
          if (parsed.detail) detail = String(parsed.detail);
        } catch {
          if (errorData) detail = errorData.slice(0, 500);
        }
        return NextResponse.json({ error: detail }, { status: res.status });
      } catch (e: unknown) {
        console.error('[COMPLIANCE_API] Start analyze connection failed:', e);
        return NextResponse.json({ error: 'Failed to connect to backend.' }, { status: 500 });
      }
    }

    if (action === 'intent') {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/compliance/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userQuery }),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
        const errorData = await res.text();
        console.error('[COMPLIANCE_API] Intent extraction failed on backend:', errorData);
        return NextResponse.json({ error: 'Backend failed to extract intent.' }, { status: res.status });
      } catch (e: unknown) {
        console.error('[COMPLIANCE_API] Intent extraction connection failed:', e);
        return NextResponse.json({ error: 'Failed to connect to backend for intent extraction.' }, { status: 500 });
      }
    }

    if (action === 'questions') {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/compliance/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userQuery,
            intent,
            answers: answers || {},
            asked_question_ids: asked_question_ids || [],
            asked_count: asked_count ?? 0,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
        const errorData = await res.text();
        console.error('[COMPLIANCE_API] Question generation failed on backend:', errorData);
        return NextResponse.json({ error: 'Backend failed to generate questions.' }, { status: res.status });
      } catch (e: unknown) {
        console.error('[COMPLIANCE_API] Question generation connection failed:', e);
        return NextResponse.json({ error: 'Failed to connect to backend for question generation.' }, { status: 500 });
      }
    }

    if (action === 'analyze' || action === 'roadmap') {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/compliance/roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userQuery,
            intent,
            answers: answers || {},
            profile: profile || null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
        const errorData = await res.text();
        console.error('[COMPLIANCE_API] Roadmap generation failed on backend:', errorData);
        return NextResponse.json({ error: 'Backend failed to generate compliance roadmap.' }, { status: res.status });
      } catch (e: unknown) {
        console.error('[COMPLIANCE_API] Roadmap connection failed:', e);
        return NextResponse.json({ error: 'Failed to connect to backend for roadmap.' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
