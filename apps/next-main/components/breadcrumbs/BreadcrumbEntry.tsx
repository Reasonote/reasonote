"use client";

import {useEffect} from "react";

import {
  Breadcrumb,
  useBreadcrumbs,
} from "@/clientOnly/context/BreadcrumbContext";

type BreadcrumbEntryProps = Breadcrumb & {
  children?: React.ReactNode;
};

/**
 * A component that automatically adds itself to the breadcrumb trail when mounted
 * and removes itself when unmounted.
 */
export const BreadcrumbEntry = ({ entityId, name, onClick, children }: BreadcrumbEntryProps) => {
  const { registerBreadcrumb, unregisterBreadcrumb } = useBreadcrumbs();

  useEffect(() => {
    const id = registerBreadcrumb({ entityId, name, onClick });
    
    // Clean up by removing this breadcrumb when the component unmounts
    return () => unregisterBreadcrumb(id);
  }, [entityId, name, onClick, registerBreadcrumb, unregisterBreadcrumb]);

  // Render children without additional DOM elements
  return <>{children}</>;
}; 