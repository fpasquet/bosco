// Ce que les scénarios ne voient pas : les règles d'un message et des réponses à une question (E2e, E2f).
import { describe, expect, it } from 'vitest';
import {
  answersOf,
  checkPilotMessage,
  InvalidAnswers,
  InvalidPilotMessage,
  joinMessages,
  questionsOf,
} from './pilot.ts';

const image = (name: string, mediaType = 'image/png', data = 'AAAA') => ({ data, mediaType, name });

describe('checkPilotMessage', () => {
  it('keeps an image alone, trims the text, refuses an empty message (CA-SESS-92)', () => {
    expect(checkPilotMessage({ images: [image('a.png')], text: '  ' })).toEqual({ images: [image('a.png')], text: '' });
    expect(() => checkPilotMessage({ images: [], text: ' \n ' })).toThrow(InvalidPilotMessage);
  });

  it('refuses more than 5 images, an unknown format or an image over 5 MB', () => {
    const six = Array.from({ length: 6 }, (_, index) => image(`${index}.png`));
    expect(() => checkPilotMessage({ images: six, text: 'x' })).toThrow('5 images au plus');
    expect(() => checkPilotMessage({ images: [image('a.pdf', 'application/pdf')], text: 'x' })).toThrow('a.pdf');
    expect(() =>
      checkPilotMessage({ images: [image('big.png', 'image/png', 'A'.repeat(7_000_001))], text: 'x' }),
    ).toThrow('5 Mo');
  });
});

describe('joinMessages', () => {
  it('joins a second message to the pending one, within 5 images (CA-SESS-93)', () => {
    const first = { images: [image('a.png')], text: 'Pense aux sigles' };
    expect(joinMessages(first, { images: [], text: 'Et les points' })).toEqual({
      images: [image('a.png')],
      text: 'Pense aux sigles\n\nEt les points',
    });
    const five = { images: Array.from({ length: 5 }, (_, index) => image(`${index}.png`)), text: '' };
    expect(() => joinMessages(five, { images: [image('6.png')], text: '' })).toThrow(InvalidPilotMessage);
  });
});

describe('questions of the agent', () => {
  const questions = questionsOf({
    questions: [
      {
        question: 'Quel correctif ?',
        header: 'Correctif',
        multiSelect: false,
        options: [{ label: 'A' }, { label: 'B' }],
      },
      {
        question: 'Quels tests ?',
        header: 'Tests',
        multiSelect: true,
        options: [{ label: 'Unitaires', description: 'u' }],
      },
      { header: 'sans question' },
    ],
  });

  it('reads the questions of AskUserQuestion, without the malformed ones', () => {
    expect(questions.map(({ multiSelect, options, question }) => [question, multiSelect, options.length])).toEqual([
      ['Quel correctif ?', false, 2],
      ['Quels tests ?', true, 1],
    ]);
  });

  it('answers each question, several choices joined by commas (CA-SESS-96)', () => {
    expect(answersOf(questions, [['B'], ['Unitaires', 'De bout en bout']])).toEqual({
      'Quel correctif ?': 'B',
      'Quels tests ?': 'Unitaires, De bout en bout',
    });
    expect(() => answersOf(questions, [['A', 'B'], ['Unitaires']])).toThrow(InvalidAnswers);
    expect(() => answersOf(questions, [[' '], ['Unitaires']])).toThrow('Réponds');
    expect(() => answersOf(questions, [['A']])).toThrow('Une réponse par question');
  });
});
