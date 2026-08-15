'use client';

import React, { useState, useRef } from 'react';

export default function MarathonPhotoSearch() {
  const [activeTab, setActiveTab] = useState<'bib' | 'selfie'>('bib');
  const [bib, setBib] = useState('');
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
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'bib' && !bib.trim()) {
      alert('Please enter your Bib Number.');
      return;
    }
    if (activeTab === 'selfie' && !selfieFile) {
      alert('Please upload a clear selfie or portrait photo.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setPhotos([]);

    try {
      if (activeTab === 'bib') {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bibNumber: bib.trim() }),
        });
        const data = await res.json();
        setPhotos(data.photos || []);
      } else if (activeTab === 'selfie' && selfieFile) {
        // Upload selfie to search endpoint
        const formData = new FormData();
        formData.append('selfie', selfieFile);
        if (bib.trim()) formData.append('bibNumber', bib.trim());

        const res = await fetch('/api/search', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSelfie = () => {
    setSelfieFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-amber-400 tracking-tight">
            Marathon Photo Portal
          </h1>
          <p className="text-neutral-400 mt-2 text-sm md:text-base">
            Find all your race moments instantly using your Bib Number or Selfie.
          </p>
        </header>

        {/* Search Mode Toggle */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-xl mx-auto shadow-xl mb-12">
          <div className="flex bg-neutral-950 p-1.5 rounded-xl mb-6 border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('bib')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'bib'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Search by Bib #
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('selfie')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'selfie'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Search by Selfie / Face
            </button>
          </div>

          <form onSubmit={handleSearch}>
            {activeTab === 'bib' ? (
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-300">
                  Enter Bib Number
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={bib}
                    onChange={(e) => setBib(e.target.value)}
                    placeholder="e.g. 2045"
                    className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none text-white text-base"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-300">
                  Upload a Clear Selfie
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-amber-400 rounded-xl p-6 text-center cursor-pointer transition bg-neutral-950 flex flex-col items-center justify-center min-h-[160px]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="Selfie preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-amber-400 mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSelfie();
                        }}
                        className="mt-2 text-xs text-red-400 hover:underline block mx-auto"
                      >
                        Remove & Choose Another
                      </button>
                    </div>
                  ) : (
                    <div>
                      <svg
                        className="mx-auto h-10 w-10 text-neutral-500 mb-2"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-sm text-neutral-400">
                        Click to select or drag and drop a selfie
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        PNG, JPG, JPEG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !selfieFile}
                  className="w-full mt-4 py-3 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Finding Your Photos...' : 'Find by Face Match'}
                </button>
              </div>
            )}
          </form>
        </div>

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
            <div className="text-center py-16 bg-neutral-900/50 rounded-2xl border border-neutral-800 text-neutral-400">
              No photos found matching your query. Please verify the bib number or try a clearer selfie.
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
                  alt={`Marathon photo ${idx + 1}`}
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