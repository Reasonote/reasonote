import {
  useRef,
  useState,
} from 'react';

/**
 * Returns a stateful value, and a ref to the most recent value of the state.
 * 
 * @param initialValue The initial value of the state.
 * @returns A tuple containing the state, a function to set the state, and a ref to the most recent value of the state.
 */
export function useStateWithRef<T>(initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>, React.RefObject<T>] {
  const [state, setStateInternal] = useState<T>(initialValue);
  const stateRef = useRef<T>(state);

  const setState = (newState: React.SetStateAction<T>) => {
    if (typeof newState === 'function') {
      // If we are updating within the setState function,
      // We have to wait until the callback is called to update the ref.
      setStateInternal((prevState) => {
        const nextState = (newState as (prevState: T) => T)(prevState);
        stateRef.current = nextState;
        return nextState;
      });
    } else {
      // Update immediately if we can.
      stateRef.current = newState;
      setStateInternal(newState);
    }
  };

  return [state, setState, stateRef];
}