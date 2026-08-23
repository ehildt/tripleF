import { harnessDataToPromptText } from './harness-data-to-prompt-text.helper';

describe('harnessDataToPromptText', () => {
  it('converts article data to readable text', () => {
    const result = harnessDataToPromptText({
      category: 'Gaming',
      title: 'Neverness to Everness',
      subtitle: 'Overview',
      summary: 'An urban open-world RPG.',
      sectionTitle: 'Details',
      sectionContent: 'Releases April 29, 2026.',
      keyFindings: [{ text: 'Urban setting' }, { text: 'Hotta Studio' }],
      sources: [{ title: 'IGN', url: 'https://ign.com' }],
      conclusion: 'Worth watching.',
    });

    expect(result).toContain('Title: Neverness to Everness');
    expect(result).toContain('An urban open-world RPG.');
    expect(result).toContain('- Urban setting');
    expect(result).toContain('Sources:');
    expect(result).toContain('Conclusion: Worth watching.');
  });

  it('converts evaluation data to readable text', () => {
    const result = harnessDataToPromptText({
      category: 'Review',
      title: 'Evaluation',
      subject: 'NTE',
      verdict: 'Promising',
      score: 8,
      scoreLabel: '8/10',
      reasoning: 'Strong visuals.',
      strengths: [{ text: 'Great art' }],
      weaknesses: [{ text: 'Unclear monetization' }],
      recommendations: [{ text: 'Wait for reviews' }],
    });

    expect(result).toContain('Subject: NTE');
    expect(result).toContain('Score: 8 (8/10)');
    expect(result).toContain('- Great art');
    expect(result).toContain('- Unclear monetization');
  });

  it('returns empty string for empty data', () => {
    expect(harnessDataToPromptText({})).toBe('');
  });

  it('serializes merge bodySections as topic blocks with lists', () => {
    const result = harnessDataToPromptText({
      sectionTitle: 'Details',
      bodySections: [
        {
          topic: 'Vision Pro',
          content: 'A narrative line.',
          strengths: [{ text: 'Great display' }],
          weaknesses: [{ text: 'High price' }],
          recommendations: [{ text: 'Try it in store' }],
          heroImageUrl: 'https://example.com/vision-pro.jpg',
          heroVideoUrl: 'https://youtube.com/watch?v=aaa',
        },
      ],
    });

    expect(result).toContain('Section: Details');
    expect(result).toContain('Topic: Vision Pro');
    expect(result).toContain('Hero image: https://example.com/vision-pro.jpg');
    expect(result).toContain('Hero video: https://youtube.com/watch?v=aaa');
    expect(result).toContain('A narrative line.');
    expect(result).toContain('Strengths:');
    expect(result).toContain('- Great display');
    expect(result).toContain('Weaknesses:');
    expect(result).toContain('- High price');
    expect(result).toContain('Recommendations:');
    expect(result).toContain('- Try it in store');
  });
});
