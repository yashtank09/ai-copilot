import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  async generateDynamicContent(payload: {
    text: string;
    mode: string;
    apiKey: string;
    model: string;
  }): Promise<string> {
    try {
      if (!payload.apiKey || payload.apiKey.trim() === '') {
        return "⚠️ Error: API Key is missing. Please configure it in the Agent Config settings tab.";
      }

      // Initialize the unified Gen AI SDK securely per client payload request
      const ai = new GoogleGenAI({ apiKey: payload.apiKey });

      let systemInstruction = "You are a helpful AI assistant inside a meeting copilot app. Answer the user's request contextually.";
      switch (payload.mode) {
        case 'summary':
          systemInstruction = "You are an AI meeting assistant. Please provide a concise summary of the following conversation or text in bullet points.";
          break;
        case 'action_items':
          systemInstruction = "Extract clear, actionable check-list items. Force structured emphasis using markdown bolding.";
          break;
        case 'code':
          systemInstruction = "Exclusively focus on building, identifying, and optimizing code snippets wrapper blocks.";
          break;
      }

      // Upgrade legacy model strings that the new unified SDK rejects
      let finalModel = payload.model;
      if (finalModel === 'gemini-pro' || finalModel.includes('-latest')) {
        finalModel = 'gemini-2.5-flash';
      }

      const result = await ai.models.generateContent({
        model: finalModel,
        contents: payload.text,
        config: { systemInstruction }
      });

      return result.text || '';
    } catch (error) {
      this.logger.error(`Error generating AI insight: ${error.message}`);
      return `❌ AI Error: ${error.message}`;
    }
  }
}
