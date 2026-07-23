import invoiceTemplate from './invoice.template.json';
import resumeTemplate from './resume.template.json';
import contractTemplate from './contract.template.json';

const templates = [invoiceTemplate, resumeTemplate, contractTemplate];

export function extractDataFromText(text: string): { type: string; data: Record<string, string> } {
    let bestMatch = { type: 'Unknown', data: {} as Record<string, string>, score: 0 };

    // Normalize newlines and spacing to help regexes slightly
    const normalizedText = text.replace(/\r\n/g, '\n');

    for (const template of templates) {
        const extracted: Record<string, string> = {};
        let matches = 0;

        for (const field of template.fields) {
            try {
                const regex = new RegExp(field.regex, 'mi');
                const match = regex.exec(normalizedText);
                if (match) {
                    // Usually we want the first capture group, but if there's none, take the whole match
                    extracted[field.name] = match[1] ? match[1].trim() : match[0].trim();
                    matches++;
                } else {
                    extracted[field.name] = ''; // Keep field empty if not found
                }
            } catch (e) {
                console.error(`Invalid regex in template ${template.type} for field ${field.name}`, e);
                extracted[field.name] = '';
            }
        }

        // Simple scoring based on how many fields we found
        if (matches > bestMatch.score && matches > 0) {
            bestMatch = { type: template.type, data: extracted, score: matches };
        }
    }

    // Fallback if nothing matched
    if (bestMatch.score === 0) {
        return { type: 'Unknown', data: { rawTextSample: text.substring(0, 100) + '...' } };
    }

    return { type: bestMatch.type, data: bestMatch.data };
}
