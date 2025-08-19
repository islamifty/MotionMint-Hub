
"use client";

import { useEffect } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

export function useFormPersistence<T extends FieldValues>(
  storageKey: string,
  form: UseFormReturn<T>,
  options: {
    exclude?: (keyof T)[];
  } = {}
) {
  const { watch, reset, getValues } = form;
  const { exclude = [] } = options;

  useEffect(() => {
    // On component mount, try to load saved data from localStorage
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Combine saved data with current form values to avoid losing defaults
          const currentValues = getValues();
          reset({ ...currentValues, ...parsedData });
        } catch (error) {
          console.error("Failed to parse form data from localStorage", error);
        }
      }
    }
  }, [storageKey, reset, getValues]);

  useEffect(() => {
    // Subscribe to form changes and save them to localStorage
    const subscription = watch((value, { name, type }) => {
      if (typeof window !== 'undefined' && name && !exclude.includes(name as keyof T)) {
        const currentData = getValues();
        // Filter out excluded fields before saving
        const dataToSave = Object.entries(currentData).reduce((acc, [key, val]) => {
            if (!exclude.includes(key as keyof T)) {
                (acc as any)[key] = val;
            }
            return acc;
        }, {} as Partial<T>);

        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, storageKey, exclude, getValues]);
}
