import { describe, it, expect } from 'vitest';
import { extractFlashcardsFromResponse, FLASHCARD_SYSTEM_PROMPT } from '../FlashcardGenerator';

describe('FlashcardGenerator', () => {
    describe('FLASHCARD_SYSTEM_PROMPT', () => {
        it('should contain key instructions', () => {
            expect(FLASHCARD_SYSTEM_PROMPT).toContain('extract key concepts');
            expect(FLASHCARD_SYSTEM_PROMPT).toContain('JSON array');
            expect(FLASHCARD_SYSTEM_PROMPT).toContain('{"q": "Question text", "a": "Answer text"}');
        });
    });

    describe('extractFlashcardsFromResponse', () => {
        it('should successfully parse a valid JSON array', () => {
            const rawResponse = `[
                {"q": "What is Svelte?", "a": "A UI framework"},
                {"q": "What is LocalMind?", "a": "A local-first workspace"}
            ]`;

            const result = extractFlashcardsFromResponse(rawResponse);

            expect(result.length).toBe(2);
            expect(result[0].q).toBe("What is Svelte?");
            expect(result[1].a).toBe("A local-first workspace");
        });

        it('should successfully parse JSON wrapped in markdown code blocks', () => {
            const rawResponse = `\`\`\`json\n[
                {"q": "Q1", "a": "A1"}
            ]\n\`\`\``;

            const result = extractFlashcardsFromResponse(rawResponse);

            expect(result.length).toBe(1);
            expect(result[0].q).toBe("Q1");
        });

        it('should successfully parse JSON when LLM includes chatty text (fallback regex test)', () => {
            const rawResponse = `Sure, here are your flashcards:

            [
                {"q": "Test Q", "a": "Test A"}
            ]

            Hope this helps!`;

            const result = extractFlashcardsFromResponse(rawResponse);

            expect(result.length).toBe(1);
            expect(result[0].q).toBe("Test Q");
        });

        it('should throw an error for completely invalid input', () => {
            const rawResponse = `I couldn't find any concepts to extract.`;

            expect(() => {
                extractFlashcardsFromResponse(rawResponse);
            }).toThrow('Failed to parse flashcards from LLM response.');
        });

        it('should ignore invalid objects in array', () => {
            const rawResponse = `[
                {"q": "Valid", "a": "Card"},
                {"question": "Invalid format", "answer": "Missing q and a"},
                "just a string"
            ]`;

            const result = extractFlashcardsFromResponse(rawResponse);

            expect(result.length).toBe(1);
            expect(result[0].q).toBe("Valid");
        });
    });
});