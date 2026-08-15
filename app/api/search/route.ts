import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    const { embedding } = await req.json();

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 512) {
      return NextResponse.json(
        { error: 'Valid 512-dimension face embedding required.' },
        { status: 400 }
      );
    }

    // Query Supabase pgvector RPC for cosine similarity
    const { data, error } = await supabase.rpc('match_face_photos', {
      query_embedding: embedding,
      match_threshold: 0.38, // Balance between accuracy and group shot recall
      match_count: 50,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ photos: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}