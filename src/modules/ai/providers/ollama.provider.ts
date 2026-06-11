import { AIProvider } from '../interfaces/ai-provider.interface';
import { Logger } from '@nestjs/common';
import axios from 'axios';

export class OllamaProvider implements AIProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(baseUrl: string, modelName: string) {
    this.baseUrl = baseUrl || 'http://localhost:11434';
    this.modelName = modelName || 'llama2';
  }

  async generate(prompt: string, options?: any): Promise<string> {
    try {
      this.logger.log(`Querying local Ollama model "${this.modelName}" at ${this.baseUrl}...`);
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.modelName,
        prompt: prompt,
        stream: false,
      });

      if (response.data && response.data.response) {
        return response.data.response;
      }
      throw new Error('Invalid response structure from Ollama API');
    } catch (err) {
      this.logger.warn(`Ollama is offline or model is missing: ${err.message}. Falling back to simulation.`);
      return this.getSimulatedResponse(prompt);
    }
  }

  private getSimulatedResponse(prompt: string): string {
    this.logger.log(`Ollama simulation generating response for prompt: "${prompt.slice(0, 30)}..."`);
    
    if (prompt.toLowerCase().includes('report') || prompt.toLowerCase().includes('pso')) {
      return `### Executive Report Summary (Ollama Llama2 Simulation)
Generated in response to request: "${prompt}"

1. **Strategic Performance Indicators (Ollama):**
   - **Service Gross Margin:** 36.2% *(Target: 35.0%)*
   - **Delivery CSAT:** 4.62/5.0 *(Target: 4.5)*
   - **Billing Leakage:** 1.5% *(Slight variance)*

2. **Core Observations (Ollama):**
   - Strategic headcount expansions in APAC region show a 10% increase in project velocity.
   - Resource demand in cloud migration has stabilized.

3. **Key Recommendations (Ollama):**
   - Standardize PMO processes in the CRM migration vertical.
   - Shift 3.0 FTEs from bench resources to support Project Apollo's final sprint.`;
    }

    return `This is a simulated Ollama (Llama2) response for prompt: "${prompt}". Ensure Ollama is running locally at \`http://localhost:11434\` and the model is downloaded to see live responses.`;
  }
}
