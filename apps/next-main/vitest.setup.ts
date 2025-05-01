import "@testing-library/jest-dom";

import {
  afterEach,
  expect,
  vi,
} from "vitest";

import * as matchers from "@testing-library/jest-dom/matchers";
import {cleanup} from "@testing-library/react";

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
}); 

// Mock next/font
vi.mock('next/font/google', () => ({
  Atkinson_Hyperlegible: () => ({
    style: {
      fontFamily: 'Atkinson_Hyperlegible',
    },
    className: 'atkinson-hyperlegible',
  }),
})); 