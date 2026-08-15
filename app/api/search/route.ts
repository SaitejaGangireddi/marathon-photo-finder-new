import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfncwwpspdjndxjutgki.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_go4T_Q6VGjRnOsfDQEf1lw_-ZrvMJYy';

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    const { embedding } = await req.json();

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json({ error: 'Valid face embedding vector is required.' }, { status: 400 });
    }

    // Match face embeddings against pgvector in Supabase
    const { data, error } = await supabase.rpc('match_face_photos', {
      query_embedding: embedding,
      match_threshold: 0.35, // Cosine threshold for matching
      match_count: 50,
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ photos: data || [] });
  } catch (err: any) {
    console.error('Search error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}