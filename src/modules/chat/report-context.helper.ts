import { PsoPortfolioStats } from '../reports/pso-excel-parser.service';

export interface ChatReportContext {
  generatedAt: Date;
  sourceFileName?: string;
  totalProjects: number;
  atRiskCount: number;
  redCount: number;
  amberCount: number;
  redProjects: string[];
  rampTotal: string;
  rampProjectCount: number;
  atRiskProjects: Array<{
    name: string;
    overallRag: string;
    risks: string;
  }>;
  projects: Array<{
    name: string;
    overallRag: string;
    schedule: string;
    budget: string;
    quality: string;
    v360Rag: string;
    rampRag: string;
    rampArr: string;
  }>;
}

export function buildReportContext(
  stats: PsoPortfolioStats,
  sourceFileName?: string,
): ChatReportContext {
  return {
    generatedAt: new Date(),
    sourceFileName,
    totalProjects: stats.totalProjects,
    atRiskCount: stats.atRiskCount,
    redCount: stats.redCount,
    amberCount: stats.amberCount,
    redProjects: stats.redProjects,
    rampTotal: stats.rampTotal,
    rampProjectCount: stats.rampProjects.length,
    atRiskProjects: stats.atRiskProjects.map((project) => ({
      name: project.name.split('|')[0].trim(),
      overallRag: project.overallRag,
      risks: project.risks,
    })),
    projects: stats.projects.map((project) => ({
      name: project.name.split('|')[0].trim(),
      overallRag: project.overallRag,
      schedule: project.schedule,
      budget: project.budget,
      quality: project.quality,
      v360Rag: project.v360Rag,
      rampRag: project.rampRag,
      rampArr: project.rampArr,
    })),
  };
}

export function buildReportContextSummary(context: ChatReportContext): string {
  const amberProjects = context.projects.filter((p) => ['Amber', 'Yellow'].includes(p.overallRag));
  const redOverall = context.projects.filter((p) => p.overallRag === 'Red');
  const greenProjects = context.projects.filter((p) => p.overallRag === 'Green');

  return [
    `PSO Portfolio Report Context (generated ${context.generatedAt.toISOString()})`,
    context.sourceFileName ? `Source file: ${context.sourceFileName}` : '',
    `Total projects: ${context.totalProjects}`,
    `At-risk projects: ${context.atRiskCount}`,
    `Red flag projects: ${context.redProjects.join(', ') || 'None'}`,
    `Projects with overall Red RAG: ${redOverall.map((p) => p.name).join(', ') || 'None'}`,
    `Projects with Amber/Yellow RAG: ${amberProjects.map((p) => p.name).join(', ') || 'None'}`,
    `Green projects: ${greenProjects.length}`,
    `Ramp contracts: ${context.rampProjectCount} projects, total ${context.rampTotal}`,
    `Top at-risk: ${context.atRiskProjects.map((p) => `${p.name} (${p.overallRag})`).join('; ')}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function isExplicitReportGenerationIntent(message: string): boolean {
  const text = message.toLowerCase().trim();
  const hasGenerateVerb = /\b(generate|create|build|produce|make|export|download)\b/.test(text);
  const hasReportNoun = /\b(report|pdf)\b/.test(text);
  return (hasGenerateVerb && hasReportNoun) || text === 'generate pso report';
}

export function isPortfolioDataQuestion(message: string): boolean {
  const text = message.toLowerCase();
  const hasQuestion =
    /\b(what|which|how many|how much|list|show|tell me|explain|describe|give me)\b/.test(text) ||
    text.includes('?');
  const hasPortfolioTopic =
    /\b(amber|yellow|red|green|rag|at.?risk|risk|status|portfolio|project|ramp|arr|flag|health)\b/.test(
      text,
    );
  return hasQuestion && hasPortfolioTopic;
}

export function tryAnswerFromReportContext(message: string, context: ChatReportContext): string | null {
  const text = message.toLowerCase();

  if (/\b(amber|yellow)\b/.test(text)) {
    const amberProjects = context.projects.filter((p) => ['Amber', 'Yellow'].includes(p.overallRag));
    if (amberProjects.length === 0) {
      return 'There are no projects with Amber/Yellow overall RAG status in the current report.';
    }
    const list = amberProjects.map((p) => `- **${p.name}** (Overall RAG: ${p.overallRag})`).join('\n');
    return `**Amber/Yellow status** indicates projects that are at-risk and need attention.\n\nIn your report, **${amberProjects.length}** project(s) have Amber/Yellow overall RAG:\n${list}`;
  }

  if (/\bred\b/.test(text) && !/\bred.?amber\b/.test(text)) {
    const redOverall = context.projects.filter((p) => p.overallRag === 'Red');
    const lines = [
      `**Red flag projects:** ${context.redProjects.join(', ') || 'None'}`,
      redOverall.length > 0
        ? `**Overall Red RAG:** ${redOverall.map((p) => p.name).join(', ')}`
        : 'No projects have Overall Red RAG.',
    ];
    return `**Red status** indicates critical at-risk projects.\n\n${lines.join('\n')}`;
  }

  if (/\bat.?risk\b/.test(text)) {
    const list = context.atRiskProjects
      .map((p) => `- **${p.name}** (${p.overallRag})`)
      .join('\n');
    return `Your report has **${context.atRiskCount}** at-risk projects out of ${context.totalProjects}.\n\nTop at-risk projects:\n${list}`;
  }

  if (/\bgreen\b/.test(text)) {
    const green = context.projects.filter((p) => p.overallRag === 'Green');
    return `**${green.length}** of ${context.totalProjects} projects have Green overall RAG status.`;
  }

  if (/\b(how many|count|total)\b/.test(text)) {
    return `Portfolio summary from your report:\n- Total projects: **${context.totalProjects}**\n- At-risk: **${context.atRiskCount}**\n- Red flags: **${context.redCount}** (${context.redProjects.join(', ') || 'None'})\n- Amber/Yellow: **${context.amberCount}**\n- Ramp contracts: **${context.rampProjectCount}** (${context.rampTotal})`;
  }

  if (/\bramp\b/.test(text)) {
    const rampProjects = context.projects.filter((p) => p.rampArr && p.rampArr !== 'N/A');
    const list = rampProjects.map((p) => `- ${p.name}: ${p.rampArr} (Ramp RAG: ${p.rampRag})`).join('\n');
    return `Your report has **${context.rampProjectCount}** ramp contracts totaling **${context.rampTotal}**:\n${list || 'None'}`;
  }

  if (isPortfolioDataQuestion(message)) {
    return `Here is a quick summary of your report:\n- **${context.totalProjects}** total projects\n- **${context.atRiskCount}** at-risk (${context.redCount} red flags, ${context.amberCount} amber)\n- Red flags: ${context.redProjects.join(', ') || 'None'}\n- Ramp: ${context.rampProjectCount} projects, ${context.rampTotal}\n\nAsk specifically about amber, red, at-risk, or ramp status for more detail.`;
  }

  return null;
}
