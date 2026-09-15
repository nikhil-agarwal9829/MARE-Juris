import { NextResponse } from 'next/server';

const API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:8000'); // FastAPI backend

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === 'production' && !API_URL) {
      return NextResponse.json({ error: 'BACKEND_API_URL is required in production.' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    const body = await req.json();

    const response = await fetch(`${API_URL}/api/v1/chat/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Backend comparison failed');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Compare API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process comparison request' },
      { status: 500 }
    );
  }
}
