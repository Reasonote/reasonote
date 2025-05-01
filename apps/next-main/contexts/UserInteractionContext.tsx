import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface UserInteractionContextType {
  hasInteracted: boolean;
  setHasInteracted: (value: boolean) => void;
}

const UserInteractionContext = createContext<UserInteractionContextType | undefined>(undefined);

export const UserInteractionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => setHasInteracted(true);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  return (
    <UserInteractionContext.Provider value={{ hasInteracted, setHasInteracted }}>
      {children}
    </UserInteractionContext.Provider>
  );
};

export const useUserInteraction = () => {
  const context = useContext(UserInteractionContext);
  if (context === undefined) {
    throw new Error('useUserInteraction must be used within a UserInteractionProvider');
  }
  return context;
};