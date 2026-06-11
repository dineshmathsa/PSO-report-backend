import { ChatOpenAI } from '@langchain/openai';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { Logger } from '@nestjs/common';

export class OpenAIProvider implements AIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private chatModel: ChatOpenAI | null = null;

  constructor(apiKey: string, modelName: string) {
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      try {
        this.chatModel = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: modelName || 'gpt-4',
          temperature: 0.7,
        });
      } catch (err) {
        this.logger.warn(`Failed to initialize ChatOpenAI: ${err.message}. Entering mock mode.`);
      }
    } else {
      this.logger.warn('OpenAI API key not configured or is placeholder. Entering mock mode.');
    }
  }

  async generate(prompt: string, options?: any): Promise<string> {
    if (this.chatModel) {
      try {
        const response = await this.chatModel.invoke(prompt);
        return response.content as string;
      } catch (err) {
        this.logger.error(`OpenAI error: ${err.message}. Falling back to simulation output.`);
        return this.getSimulatedResponse(prompt);
      }
    }
    return this.getSimulatedResponse(prompt);
  }

  private getSimulatedResponse(prompt: string): string {
    this.logger.log(`OpenAI simulation generating response for prompt: "${prompt.slice(0, 30)}..."`);
    
    // Check if it looks like a report generation
    if (prompt.toLowerCase().includes('report') || prompt.toLowerCase().includes('pso')) {
      return `### Executive Report Summary (OpenAI Simulation)
Generated in response to request: "${prompt}"

1. **Strategic Performance Indicators:**
   - **Service Gross Margin:** 38.4% *(Target: 35.0%)*
   - **Delivery CSAT:** 4.75/5.0 *(Excellent)*
   - **Billing Leakage:** <1.2% *(Optimal)*

2. **Core Observations:**
   - Resource demand in cloud migration has stabilized.
   - Strategic headcount expansions in APAC region show a 12% increase in project velocity.

3. **Key Recommendations:**
   - Shift 3.0 FTEs from bench resources to support Project Apollo's final sprint.
   - Standardize PMO processes in the CRM migration vertical.`;
    }

    return `This is a simulated OpenAI response for prompt: "${prompt}". Configure a valid \`OPENAI_API_KEY\` in your \`.env\` file to see live responses.`;
  }
}
