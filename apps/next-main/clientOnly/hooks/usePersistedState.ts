import {
  useEffect,
  useState,
} from "react";

type StorageType = 'localStorage' | 'sessionStorage';

interface UsePersistedStateOptions {
  storageType?: StorageType;
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: UsePersistedStateOptions = {}
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { storageType = 'localStorage' } = options;
  
  // Use a function to initialize state to avoid unnecessary computation
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    const storedValue = window[storageType].getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window[storageType].setItem(key, JSON.stringify(state));
    }
  }, [key, state, storageType]);

  return [state, setState];
}