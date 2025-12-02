'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SaveListingButtonProps {
  listingId: string;
}

export function SaveListingButton({ listingId }: SaveListingButtonProps) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSaved = useCallback(async () => {
    try {
      const res = await fetch(`/api/saved/${listingId}`);
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.saved);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  }, [listingId]);

  useEffect(() => {
    if (session) {
      checkSaved();
    }
  }, [session, checkSaved]);

  const toggleSaved = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/saved/${listingId}`, {
        method: isSaved ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.error('Error toggling saved:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <button
      onClick={toggleSaved}
      disabled={loading}
      className={`px-4 py-2 rounded-lg transition ${
        isSaved
          ? 'bg-primary-600 text-white hover:bg-primary-700'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      } disabled:opacity-50`}>
      {isSaved ? '✓ Збережено' : 'Зберегти'}
    </button>
  );
}
