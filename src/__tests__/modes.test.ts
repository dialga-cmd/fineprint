import { describe, it, expect } from 'vitest';
import { getMode, buildSystemPrompt, MODES, DISCLAIMER, DISCLAIMER_RULE } from '@/lib/modes';

describe('MODES', () => {
  it('contains 5 modes', () => {
    expect(MODES).toHaveLength(5);
  });

  it('has unique ids', () => {
    const ids = MODES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each mode has required fields', () => {
    for (const mode of MODES) {
      expect(mode.id).toBeTruthy();
      expect(mode.label).toBeTruthy();
      expect(mode.description).toBeTruthy();
      expect(mode.model).toBeTruthy();
      expect(mode.prompt).toBeTruthy();
    }
  });

  it('all modes use gemini model', () => {
    for (const mode of MODES) {
      expect(mode.model).toMatch(/gemini/);
    }
  });
});

describe('getMode', () => {
  it('returns the correct mode by id', () => {
    const mode = getMode('summarize');
    expect(mode.id).toBe('summarize');
    expect(mode.label).toBe('Summarize');
  });

  it('falls back to "ask" mode for unknown id', () => {
    const mode = getMode('nonexistent');
    expect(mode.id).toBe('ask');
  });

  it('falls back to "ask" for null', () => {
    expect(getMode(null).id).toBe('ask');
  });

  it('falls back to "ask" for undefined', () => {
    expect(getMode(undefined).id).toBe('ask');
  });
});

describe('buildSystemPrompt', () => {
  it('includes the mode prompt', () => {
    const mode = getMode('summarize');
    const prompt = buildSystemPrompt(mode);
    expect(prompt).toContain(mode.prompt);
  });

  it('appends disclaimer rule', () => {
    const mode = getMode('ask');
    const prompt = buildSystemPrompt(mode);
    expect(prompt).toContain(DISCLAIMER_RULE);
  });

  it('includes document context when provided', () => {
    const mode = getMode('ask');
    const prompt = buildSystemPrompt(mode, 'This is a contract.');
    expect(prompt).toContain('DOCUMENT CONTEXT');
    expect(prompt).toContain('This is a contract.');
    expect(prompt).toContain('<document>');
  });

  it('omits document section when no docText', () => {
    const mode = getMode('ask');
    const prompt = buildSystemPrompt(mode);
    expect(prompt).not.toContain('DOCUMENT CONTEXT');
    expect(prompt).not.toContain('<document>');
  });

  it('omits document section for empty string', () => {
    const mode = getMode('ask');
    const prompt = buildSystemPrompt(mode, '   ');
    expect(prompt).not.toContain('DOCUMENT CONTEXT');
  });
});

describe('DISCLAIMER', () => {
  it('contains "not legal advice"', () => {
    expect(DISCLAIMER).toContain('not legal advice');
  });
});
