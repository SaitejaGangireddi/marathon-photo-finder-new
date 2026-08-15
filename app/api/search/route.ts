import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    const { bibNumber, faceEmbedding } = await req.json();
    const results: any[] = [];

    // 1. Search by Bib Number
    if (bibNumber && bibNumber.trim() !== '') {
      const { data: bibData, error: bibError } = await supabase
        .from('photos')
        .select('id, image_url, bib_numbers')
        .contains('bib_numbers', [bibNumber.trim()]);

      if (!bibError && bibData) {
        results.push(...bibData);
      }
    }

    // 2. Search by Vector Similarity
    if (faceEmbedding && Array.isArray(faceEmbedding) && faceEmbedding.length === 512) {
      const { data: faceData, error: faceError } = await supabase.rpc('match_face_photos', {
        query_embedding: faceEmbedding,
        match_threshold: 0.45,
        match_count: 60,
      });

      if (!faceError && faceData) {
        results.push(...faceData);
      }
    }

    // Deduplicate
    const uniqueMap = new Map();
    results.forEach((item) => {
      const key = item.id || item.photo_id;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    return NextResponse.json({ photos: Array.from(uniqueMap.values()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}