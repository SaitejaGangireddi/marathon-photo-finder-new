'use client';

import React, { useState } from 'react';

export default function MarathonPhotoSearch() {
  const [bib, setBib] = useState('');
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bib.trim()) {
      alert('Please enter your Bib Number.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setPhotos([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bibNumber: bib }),
      });

      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-amber-400 tracking-tight">
            Marathon Photo Portal
          </h1>
          <p className="text-neutral-400 mt-2">
            Enter your bib number below to view all individual and group photos.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-neutral-800 border border-neutral-700 p-6 rounded-2xl max-w-xl mx-auto shadow-lg mb-12"
        >
          <label className="block text-sm font-medium mb-2 text-neutral-300">
            Bib Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={bib}
              onChange={(e) => setBib(e.target.value)}
              placeholder="e.g. 2045"
              className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <section>
          {hasSearched && (
            <h2 className="text-2xl font-bold mb-6">
              Found {photos.length} Photo{photos.length === 1 ? '' : 's'}
            </h2>
          )}

          {hasSearched && photos.length === 0 && !loading && (
            <div className="text-center py-12 text-neutral-500">
              No photos found for Bib #{bib}.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {photos.map((item, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl bg-neutral-800 border border-neutral-700 aspect-[4/3] group relative"
              >
                <img
                  src={item.image_url}
                  alt={`Marathon photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <a
                  href={item.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  View Full Res
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}