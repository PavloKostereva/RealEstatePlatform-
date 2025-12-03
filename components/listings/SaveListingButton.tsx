'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSavedListing, useToggleSaved } from '@/hooks/useSaved';

interface SaveListingButtonProps {
  listingId: string;
}

export function SaveListingButton({ listingId }: SaveListingButtonProps) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(false);

  // Використовуємо React Query для перевірки saved статусу
  const { data: savedData, isLoading, refetch: refetchSaved } = useSavedListing(listingId);
  const toggleSavedMutation = useToggleSaved();

  // Використовуємо savedData безпосередньо, але з fallback на локальний стан
  const isSavedState = savedData?.saved ?? isSaved;

  // Синхронізуємо стан з React Query
  useEffect(() => {
    if (savedData !== undefined) {
      setIsSaved(savedData.saved || false);
    }
  }, [savedData]);

  const toggleSaved = async () => {
    if (!session) return;

    // Оптимістичне оновлення - одразу змінюємо стан
    const newSavedState = !isSavedState;
    setIsSaved(newSavedState);

    toggleSavedMutation.mutate(
      {
        listingId: listingId,
        isSaved: isSavedState,
      },
      {
        onSuccess: () => {
          // Перезапитуємо дані для переконання що все синхронізовано
          refetchSaved();
        },
        onError: (error) => {
          // Відкатуємо оптимістичне оновлення при помилці
          setIsSaved(!newSavedState);
          console.error('Error toggling saved:', error);
        },
      },
    );
  };

  if (!session) return null;

  const loading = toggleSavedMutation.isPending || isLoading;

  return (
    <button
      onClick={toggleSaved}
      disabled={loading}
      className={`px-4 py-2 rounded-lg transition ${
        isSavedState
          ? 'bg-primary-600 text-white hover:bg-primary-700'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      } disabled:opacity-50 disabled:cursor-not-allowed`}>
      {loading ? '...' : isSavedState ? 'Збережено' : 'Зберегти'}
    </button>
  );
}
