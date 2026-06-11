export interface Agent {
  /**
   * Runs the agent's workflow for a specific task.
   * @param task Task description or prompt query
   * @param context Additional contextual attributes
   */
  execute(task: string, context?: any): Promise<string>;
}
