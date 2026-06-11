import { Agent } from '../interfaces/agent.interface';
import { AIService } from '../../ai/ai.service';
import { VectorDBService } from '../../vector-db/vector-db.service';
import { Logger } from '@nestjs/common';

export abstract class BaseAgent implements Agent {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly aiService: AIService,
    protected readonly vectorDbService: VectorDBService,
  ) {}

  /**
   * The Template Method defining the skeleton of the report generation workflow.
   */
  public async execute(task: string, inputContext: any = {}): Promise<string> {
    this.logger.log(`Starting execution flow for task: "${task}"`);
    
    // Step 1: Initialize compilation context
    const context = {
      task,
      inputContext,
      retrievedDocuments: [],
      metrics: null,
      summary: '',
      recommendations: '',
      finalReport: '',
    };

    // Step 2: Fetch context (retrieval from Vector DB)
    context.retrievedDocuments = await this.fetchContext(task, context);

    // Step 3: Analyze metrics
    context.metrics = await this.analyzeMetrics(context);

    // Step 4: Generate executive summary
    context.summary = await this.generateSummary(context);

    // Step 5: Generate actionable recommendations
    context.recommendations = await this.generateRecommendations(context);

    // Step 6: Construct structured report output
    context.finalReport = await this.constructFinalReport(context);

    this.logger.log('Execution flow successfully completed.');
    return context.finalReport;
  }

  // --- Abstract steps to be implemented/overridden by concrete subclasses ---

  /**
   * Retrieves relevant text blocks or data context.
   */
  protected abstract fetchContext(task: string, context: any): Promise<string[]>;

  /**
   * Evaluates key performance metrics or indicators from context.
   */
  protected abstract analyzeMetrics(context: any): Promise<any>;

  /**
   * Generates a descriptive summary.
   */
  protected abstract generateSummary(context: any): Promise<string>;

  /**
   * Brainstorms recommendations based on audit.
   */
  protected abstract generateRecommendations(context: any): Promise<string>;

  /**
   * Synthesizes all elements into a structured markdown report.
   */
  protected abstract constructFinalReport(context: any): Promise<string>;
}
