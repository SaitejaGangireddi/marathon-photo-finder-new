import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfncwwpspdjndxjutgki.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbmN3d3BzcGRqbmR4anV0Z2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3MzkyOCwiZXhwIjoyMTAyMzQ5OTI4fQ.5izcthsJq6cCbG0N0zCtqXARRLE-ezwzeBKp5jIf09c';

// Hugging Face Space API Endpoint
const HF_API_URL = 'https://saiteja0454-marathon-face-api.hf.space/api/predict';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded.' }, { status: 400 });
    }

    // 1. Convert image to Data URL Base64 for Gradio API
    const buffer = await file.arrayBuffer();
    const base64Image = `data:${file.type || 'image/jpeg'};base64,${Buffer.from(buffer).toString('base64')}`;

    // 2. Request 512D ArcFace embedding from Hugging Face Space
    const hfRes = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [base64Image] }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return NextResponse.json({ error: `Face API error: ${errText}` }, { status: 502 });
    }

    const hfData = await hfRes.json();
    const result = hfData?.data?.[0];

    if (!result || result.error || !result.embedding) {
      return NextResponse.json(
        { error: result?.error || 'No face detected in selfie. Please upload a clear photo.' },
        { status: 400 }
      );
    }

    // 3. Query Supabase vector similarity
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data: matchedPhotos, error: rpcError } = await supabase.rpc('match_face_photos', {
      query_embedding: result.embedding,
      match_threshold: 0.38,
      match_count: 50,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ photos: matchedPhotos || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
