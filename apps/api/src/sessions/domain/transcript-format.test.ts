// Seuils du format illisible : combien de lignes jugent un transcript, combien de transcripts d'affilée font passer
// la source « À mettre à jour » ; les scénarios n'en jouent qu'un cas.
import { describe, expect, it } from 'vitest';
import { judgeTranscript, TranscriptFormats, UNREADABLE_IN_A_ROW } from './transcript-format.ts';

describe('transcript format', () => {
  it('judges a transcript readable from one read line, unreadable from five lines without any', () => {
    expect(judgeTranscript({ lines: 1, read: 1 })).toBe('readable');
    expect(judgeTranscript({ lines: 4, read: 0 })).toBe('unknown');
    expect(judgeTranscript({ lines: 5, read: 0 })).toBe('unreadable');
  });

  it('CA-SESS-57 · marks a source to update after three unreadable transcripts in a row, a readable one resetting', () => {
    const formats = new TranscriptFormats();
    formats.note('pro', 'unreadable');
    formats.note('pro', 'unreadable');
    formats.note('pro', 'readable');
    formats.note('pro', 'unreadable');
    expect(formats.isOutdated('pro')).toBe(false);
    for (let count = 1; count < UNREADABLE_IN_A_ROW; count++) formats.note('pro', 'unreadable');
    expect([formats.isOutdated('pro'), formats.isOutdated('perso')]).toEqual([true, false]);
    formats.note('pro', 'readable');
    expect(formats.isOutdated('pro')).toBe(true);
  });
});
