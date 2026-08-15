import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfncwwpspdjndxjutgki.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbmN3d3BzcGRqbmR4anV0Z2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3MzkyOCwiZXhwIjoyMTAyMzQ5OTI4fQ.5izcthsJq6cCbG0N0zCtqXARRLE-ezwzeBKp5jIf09c';

// Hugging Face Space base URL
const HF_BASE_URL = 'https://saiteja0454-marathon-face-api.hf.space';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded.' }, { status: 400 });
    }

    // 1. Convert image to Data URL Base64
    const buffer = await file.arrayBuffer();
    const base64Image = `data:${file.type || 'image/jpeg'};base64,${Buffer.from(buffer).toString('base64')}`;

    // 2. Call Hugging Face Gradio API
    let hfRes = await fetch(`${HF_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [base64Image] }),
    });

    let hfData: any;
    if (hfRes.ok) {
      hfData = await hfRes.json();
    } else {
      // Fallback for newer Gradio endpoints
      const altRes = await fetch(`${HF_BASE_URL}/gradio_api/call/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [base64Image] }),
      });
      if (altRes.ok) {
        const callData = await altRes.json();
        const eventId = callData.event_id;
        const resultRes = await fetch(`${HF_BASE_URL}/gradio_api/call/predict/${eventId}`);
        const textStream = await resultRes.text();
        const jsonMatch = textStream.match(/data:\s*(\[.*\])/);
        if (jsonMatch) {
          hfData = { data: JSON.parse(jsonMatch[1]) };
        }
      }
    }

    const result = hfData?.data?.[0];
    const embedding = result?.embedding || (Array.isArray(result) && result.length === 512 ? result : null);

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 512) {
      return NextResponse.json(
        { error: result?.error || 'No face detected in selfie. Try a closer, well-lit photo.' },
        { status: 400 }
      );
    }

    // 3. Vector similarity match in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data: matchedPhotos, error: rpcError } = await supabase.rpc('match_face_photos', {
      query_embedding: embedding,
      match_threshold: 0.25, // Lowered threshold for higher recall
      match_count: 50,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ photos: matchedPhotos || [] });
  } catch (err: any) {
    console.error('Search error:', err);
    return NextResponse.json({ error: err.message || 'Face search failed' }, { status: 500 });
  }
}