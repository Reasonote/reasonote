import {
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import {SkillFullIconDumb} from "./SkillFullIconDumb";

describe('SkillFullIconDumb', () => {
  it('renders emoji when valid emoji is provided', () => {
    render(<SkillFullIconDumb emoji="🎯" />);
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('renders SkillIcon when no emoji is provided', () => {
    render(<SkillFullIconDumb />);
    expect(screen.getByTestId('skill-icon')).toBeInTheDocument();
  });

  it('renders SkillIcon when invalid emoji is provided', () => {
    render(<SkillFullIconDumb emoji="not-an-emoji" />);
    expect(screen.getByTestId('skill-icon')).toBeInTheDocument();
  });

  it('renders SkillIcon when null emoji is provided', () => {
    render(<SkillFullIconDumb emoji={null} />);
    expect(screen.getByTestId('skill-icon')).toBeInTheDocument();
  });
}); 