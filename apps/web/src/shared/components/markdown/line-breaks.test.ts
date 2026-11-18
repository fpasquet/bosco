import { describe, expect, it } from 'vitest';
import { withLineBreaks } from './line-breaks';

describe('withLineBreaks', () => {
  it('CA-SESS-194 · turns a single newline into a Markdown hard break', () => {
    expect(withLineBreaks('first `a`\nsecond')).toBe('first `a`  \nsecond');
  });

  it('keeps paragraphs apart', () => {
    expect(withLineBreaks('first\n\nsecond')).toBe('first\n\nsecond');
  });

  it('leaves code blocks untouched', () => {
    const text = 'run:\n```bash\nmake a\nmake b\n```\nthen';
    expect(withLineBreaks(text)).toBe('run:\n```bash\nmake a\nmake b\n```\nthen');
  });
});
