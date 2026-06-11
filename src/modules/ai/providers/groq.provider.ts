import { ChatOpenAI } from '@langchain/openai';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { Logger } from '@nestjs/common';

export class GroqProvider implements AIProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private chatModel: ChatOpenAI | null = null;

  constructor(apiKey: string, modelName: string, baseUrl: string) {
    if (apiKey && apiKey !== 'your_groq_api_key_here') {
      try {
        this.chatModel = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: modelName || 'llama-3.1-8b-instant',
          temperature: 0.7,
          configuration: {
            baseURL: baseUrl || 'https://api.groq.com/openai/v1',
          },
        });
        this.logger.log(`GroqProvider initialized with model "${modelName}" at ${baseUrl}`);
      } catch (err) {
        this.logger.warn(`Failed to initialize Groq ChatOpenAI: ${err.message}. Entering mock mode.`);
      }
    } else {
      this.logger.warn('Groq API key not configured or is placeholder. Entering mock mode.');
    }
  }

  async generate(prompt: string, options?: any): Promise<string> {
    if (this.chatModel) {
      try {
        const response = await this.chatModel.invoke(prompt);
        return response.content as string;
      } catch (err) {
        this.logger.error(`Groq error: ${err.message}. Falling back to simulation output.`);
        return this.getSimulatedResponse(prompt);
      }
    }
    return this.getSimulatedResponse(prompt);
  }

  private getSimulatedResponse(prompt: string): string {
    this.logger.log(`Groq simulation generating response for prompt: "${prompt.slice(0, 30)}..."`);

    if (prompt.toLowerCase().includes('report') || prompt.toLowerCase().includes('pso')) {
      return `### Executive Report Summary (Groq Simulation)
Generated in response to request: "${prompt}"

1. **Strategic Performance Indicators (Groq):**
   - **Service Gross Margin:** 37.1% *(Target: 35.0%)*
   - **Delivery CSAT:** 4.68/5.0 *(Target: 4.5)*
   - **Billing Leakage:** 1.1% *(Within tolerance)*

2. **Core Observations (Groq):**
   - Strategic headcount expansions in APAC region show an 11% increase in project velocity.
   - Resource demand in cloud migration has stabilized.

3. **Key Recommendations (Groq):**
   - Standardize PMO processes in the CRM migration vertical.
   - Shift 2.5 FTEs from bench resources to support Project Apollo's final sprint.`;
    }

    return `This is a simulated Groq response for prompt: "${prompt}". Configure a valid \`GROQ_API_KEY\` in your \`.env\` file to see live responses.`;
  }
}
