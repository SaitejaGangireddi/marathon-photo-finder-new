'use client';

import React, { useState, useRef } from 'react';

export default function SelfieSearchPage() {
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setHasSearched(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile) {
      alert('Please select or capture a selfie first.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setPhotos([]);

    try {
      const formData = new FormData();
      formData.append('file', selfieFile);

      // Extract embedding and search matching photos
      const res = await fetch('/api/extract-and-search', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setPhotos(data.photos || []);
      } else {
        alert(data.error || 'Face match failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to search photos.');
    } finally {
      setLoading(false);
    }
  };

  const clearSelfie = () => {
    setSelfieFile(null);
    setPreviewUrl(null);
    setPhotos([]);
    setHasSearched(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-amber-400 tracking-tight">
            AI Marathon Face Finder
          </h1>
          <p className="text-neutral-400 mt-2 text-sm md:text-base">
            Upload your selfie to instantly retrieve all solo and group photos featuring you.
          </p>
        </header>

        {/* Upload Card */}
        <form
          onSubmit={handleSearch}
          className="bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-2xl max-w-xl mx-auto shadow-2xl mb-12"
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-700 hover:border-amber-400 rounded-2xl p-8 text-center cursor-pointer transition bg-neutral-950 flex flex-col items-center justify-center min-h-[220px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Selfie preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-400 shadow-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelfie();
                  }}
                  className="mt-3 text-xs text-red-400 hover:underline"
                >
                  Change Selfie
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-400 text-2xl">
                  📸
                </div>
                <p className="text-base font-semibold text-neutral-200">
                  Click to Upload or Take a Selfie
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  JPG, PNG, or WEBP (A clear, forward-facing photo works best)
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !selfieFile}
            className="w-full mt-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl transition text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Finding Your Race Photos...' : 'Find My Photos'}
          </button>
        </form>

        {/* Gallery Results */}
        <section>
          {hasSearched && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Found {photos.length} Photo{photos.length === 1 ? '' : 's'}
              </h2>
            </div>
          )}

          {hasSearched && photos.length === 0 && !loading && (
            <div className="text-center py-16 bg-neutral-900/40 rounded-2xl border border-neutral-800 text-neutral-400">
              No matching photos found. Make sure photos have been indexed via Colab.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {photos.map((item, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 aspect-[4/3] group relative shadow-md"
              >
                <img
                  src={item.image_url}
                  alt={`Matched race photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <a
                  href={item.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-md"
                >
                  View Full Res ↗
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}