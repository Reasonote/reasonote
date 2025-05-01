"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import {v4 as uuidv4} from "uuid";

// Types for breadcrumbs
export type Breadcrumb = {
  entityId?: string;
  name?: string;
  onClick?: () => void;
};

type BreadcrumbWithId = Breadcrumb & { id: string };

type BreadcrumbContextType = {
  breadcrumbs: BreadcrumbWithId[];
  registerBreadcrumb: (crumb: Breadcrumb) => string;
  unregisterBreadcrumb: (id: string) => void;
};

// Create the context
const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

/**
 * Hook to access the breadcrumbs context
 * @returns The breadcrumbs context
 */
export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
  }
  return context;
};

/**
 * Provider component for breadcrumbs
 * @param children - React children
 */
export const BreadcrumbProvider = ({ children }: { children: React.ReactNode }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbWithId[]>([]);

  const registerBreadcrumb = useCallback((crumb: Breadcrumb) => {
    const id = uuidv4();
    setBreadcrumbs((prev) => [...prev, { ...crumb, id }]);
    return id;
  }, []);

  const unregisterBreadcrumb = useCallback((id: string) => {
    setBreadcrumbs((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, registerBreadcrumb, unregisterBreadcrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};
