"use client";

import {useReactiveVar} from "@apollo/client";

import {
  Breadcrumb,
  headerBreadcrumbsVar,
} from "../state/userVars";

/**
 * Hook for managing header breadcrumbs
 * 
 * @returns An object with the current breadcrumbs and a function to set them
 */
export function useHeaderBreadcrumbs() {
  const breadcrumbs = useReactiveVar(headerBreadcrumbsVar);
  
  /**
   * Set the header breadcrumbs
   * 
   * @param newBreadcrumbs - An array of breadcrumbs to display, or null to hide breadcrumbs
   */
  const setBreadcrumbs = (newBreadcrumbs: Breadcrumb[] | null) => {
    headerBreadcrumbsVar(newBreadcrumbs);
  };

  return {
    breadcrumbs,
    setBreadcrumbs,
  };
}
