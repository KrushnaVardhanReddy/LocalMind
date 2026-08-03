export interface Flashcard {
    q: string;
    a: string;
}

export const FLASHCARD_SYSTEM_PROMPT = `You are an expert educational assistant. Your task is to extract key concepts from the provided text and convert them into study flashcards.
Output ONLY a JSON array of flashcards, where each object exactly matches this format: {"q": "Question text", "a": "Answer text"}.
Do not include any markdown formatting, explanations, or text outside of the JSON array.
The questions should be concise and test the core concepts of the text.
The answers should be accurate, clear, and comprehensive.
Create at least 5 to 10 flashcards, depending on the length and density of the text.`;

export function extractFlashcardsFromResponse(response: string): Flashcard[] {
    let cleanResponse = response.trim();

    // Remove markdown code block formatting if the LLM adds it
    if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.substring(7);
    } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.substring(3);
    }

    if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
    }

    cleanResponse = cleanResponse.trim();

    try {
        const parsed = JSON.parse(cleanResponse);

        if (Array.isArray(parsed)) {
            // Filter and validate the format
            const validCards = parsed.filter(item =>
                item && typeof item === 'object' &&
                typeof item.q === 'string' &&
                typeof item.a === 'string'
            ) as Flashcard[];

            if (validCards.length > 0) {
                return validCards;
            }
        }
    } catch (e) {
        // Fallback: try to find a JSON array within the text if JSON.parse fails on the whole string
        const match = cleanResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
            try {
                const parsed = JSON.parse(match[0]);
                if (Array.isArray(parsed)) {
                    const validCards = parsed.filter(item =>
                        item && typeof item === 'object' &&
                        typeof item.q === 'string' &&
                        typeof item.a === 'string'
                    ) as Flashcard[];

                    if (validCards.length > 0) {
                        return validCards;
                    }
                }
            } catch (innerE) {
                // Ignore fallback error
            }
        }
    }

    throw new Error('Failed to parse flashcards from LLM response.');
}
