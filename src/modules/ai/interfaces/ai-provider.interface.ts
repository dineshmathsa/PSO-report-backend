export interface AIProvider {
  /**
   * Generates a response from the AI model based on the prompt.
   * @param prompt The prompt to send to the AI model
   * @param options Additional provider-specific configuration overrides
   */
  generate(prompt: string, options?: any): Promise<string>;
}
