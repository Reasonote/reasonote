"use client";
import {makeVar} from "@apollo/client";

export const rsnUserIdVar = makeVar<string | undefined | null>(undefined);
export const sidebarCollapsedVar = makeVar<boolean>(true);

// Breadcrumb types
export type SkillBreadcrumb = {
  id: string;
};

export type CustomBreadcrumb = {
  name: string;
  onClick: () => void;
};

export type Breadcrumb = SkillBreadcrumb | CustomBreadcrumb;

export const headerBreadcrumbsVar = makeVar<Breadcrumb[] | null>(null);