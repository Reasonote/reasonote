// AIBrowserProvider component
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from "react";

import {
  AIBrowser,
  AIBrowserContext,
} from "@reasonote/lib-ai-browser";

import {useToken} from "../hooks/useToken";

// Create a context for the AIBrowser
const AIBrowserReactContext = createContext<AIBrowser | null>(null);

// Props for the AIBrowserProvider component
interface AIBrowserProviderProps {
  hostUrl: string;
  children: ReactNode;
}

export const AIBrowserProvider: React.FC<AIBrowserProviderProps> = ({ hostUrl, children }) => {
  const {token} = useToken();

  // Create memoized instances of AIBrowserContext and AIBrowser
  const aiBrowser = useMemo(() => {
    const browserContext = new AIBrowserContext({ 
      hostUrl, 
      // Override fetch to pass auth token.
      fetch: (url: any, init: Parameters<typeof fetch>[1]) => { return fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } });} });
    return new AIBrowser(browserContext);
  }, [hostUrl, token]);

  return (
    <AIBrowserReactContext.Provider value={aiBrowser}>
      {children}
    </AIBrowserReactContext.Provider>
  );
};

// Custom hook to use the AIBrowser
export const useAI = (): AIBrowser => {
  const context = useContext(AIBrowserReactContext);
  if (context === null) {
    throw new Error('useAI must be used within an AIBrowserProvider');
  }
  return context;
};