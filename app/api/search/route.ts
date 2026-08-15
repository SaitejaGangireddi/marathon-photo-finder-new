import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from '@gradio/client';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfncwwpspdjndxjutgki.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbmN3d3BzcGRqbmR4anV0Z2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3MzkyOCwiZXhwIjoyMTAyMzQ5OTI4fQ.5izcthsJq6cCbG0N0zCtqXARRLE-ezwzeBKp5jIf09c';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded.' }, { status: 400 });
    }

    // 1. Connect to Hugging Face Space using the official Gradio Client
    const app = await Client.connect("saiteja0454/marathon-face-api");
    const result: any = await app.predict("/predict", [file]);

    const output = result?.data?.[0];
    const embedding = output?.embedding;

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 512) {
      return NextResponse.json(
        { error: output?.error || 'No face detected in the photo. Please try a clearer selfie.' },
        { status: 400 }
      );
    }

    // 2. Query Supabase vector similarity
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data: matchedPhotos, error: rpcError } = await supabase.rpc('match_face_photos', {
      query_embedding: embedding,
      match_threshold: 0.25,
      match_count: 50,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ photos: matchedPhotos || [] });
  } catch (err: any) {
    console.error('Face search error:', err);
    return NextResponse.json({ error: err.message || 'Face search failed' }, { status: 500 });
  }
}
