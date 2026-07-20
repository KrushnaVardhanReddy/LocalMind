import { get } from 'svelte/store';
import { aiSettings } from '$lib/stores/aiSettingsStore';

export class AiService {

  private static async callOpenAiEndpoint(messages: any[], temperature = 0) {
    const settings = get(aiSettings);

    if (!settings.aiEnabled) {
      throw new Error("AI features are disabled.");
    }

    if (!settings.apiKey) {
      throw new Error("API Key is missing. Please configure it in AI Settings.");
    }

    const response = await fetch(`${settings.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: messages,
        temperature: temperature,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`AI Request Failed: ${response.status} - ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
       throw new Error("Empty response from AI provider.");
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error("Failed to parse JSON response from AI provider.");
    }
  }

  static async generateSql(schemaPayload: any, userPrompt: string): Promise<{ sql: string, explanation: string }> {
    const systemPrompt = `You are an expert DuckDB SQL assistant.
Given a schema, return a JSON object with exactly two keys: 'sql' and 'explanation'.
The 'sql' key must contain a valid DuckDB SQL query answering the user's prompt.
The 'explanation' key must contain a short explanation.
Ensure the SQL uses the exact table and column names provided.`;

    const userMessage = `Schema context:\n${JSON.stringify(schemaPayload, null, 2)}\n\nPrompt: ${userPrompt}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    const result = await this.callOpenAiEndpoint(messages, 0);

    if (!result.sql) {
      throw new Error("AI did not return a valid SQL property.");
    }

    return result as { sql: string, explanation: string };
  }

  static async generateInsights(aggregationPayload: any, userPrompt: string): Promise<{ insight: string }> {
    const systemPrompt = `You are a data analyst.
Given aggregated data metrics, return a JSON object with exactly one key: 'insight'.
The 'insight' key must contain a clear, concise executive summary in natural language based ONLY on the provided aggregated data.
Do not hallucinate data.`;

    const userMessage = `Aggregated Data:\n${JSON.stringify(aggregationPayload, null, 2)}\n\nPrompt: ${userPrompt}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    const result = await this.callOpenAiEndpoint(messages, 0.7);

    if (!result.insight) {
      throw new Error("AI did not return a valid insight property.");
    }

    return result as { insight: string };
  }
}
