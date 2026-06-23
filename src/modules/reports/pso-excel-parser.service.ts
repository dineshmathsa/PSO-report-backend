import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface PsoProject {
  name: string;
  segment: string;
  projectManager: string;
  overallRag: string;
  customerSentiment: string;
  schedule: string;
  budget: string;
  quality: string;
  resourcesRag: string;
  v360Rag: string;
  rampRag: string;
  rampArr: string;
  rampArrRaw: number;
  arr: string;
  currentStage: string;
  currentGoLive: string;
  currentUnlock: string;
  risks: string;
  mitigationPlan: string;
  mitigationOwner: string;
  mitigationDate: string;
}

export interface PsoPortfolioStats {
  totalProjects: number;
  atRiskCount: number;
  redCount: number;
  amberCount: number;
  redProjects: string[];
  rampProjects: PsoProject[];
  rampTotal: string;
  projects: PsoProject[];
  atRiskProjects: PsoProject[];
}

export interface ParsedPsoWorkbook {
  projects: PsoProject[];
  stats: PsoPortfolioStats;
}

@Injectable()
export class PsoExcelParserService {
  parse(buffer: Buffer): ParsedPsoWorkbook {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'in-flight') || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as unknown[][];

    const headerIndex = rows.findIndex((row) => String(row[0] || '').trim().startsWith('Customers / Projects'));
    if (headerIndex === -1) {
      return { projects: [], stats: this.buildStats([]) };
    }

    const projects = rows
      .slice(headerIndex + 1)
      .map((row) => this.mapRow(row))
      .filter((project) => project.name.includes('|') && project.overallRag !== 'N/A');

    return {
      projects,
      stats: this.buildStats(projects),
    };
  }

  private mapRow(row: unknown[]): PsoProject {
    return {
      name: this.cell(row, 0),
      segment: this.cell(row, 1),
      projectManager: this.cell(row, 2),
      overallRag: this.normalizeRag(this.cell(row, 3)),
      customerSentiment: this.normalizeRag(this.cell(row, 16)),
      schedule: this.normalizeRag(this.cell(row, 11)),
      budget: this.normalizeRag(this.cell(row, 12)),
      quality: this.normalizeRag(this.cell(row, 13)),
      resourcesRag: this.normalizeRag(this.cell(row, 14)),
      v360Rag: this.normalizeRag(this.cell(row, 4)),
      rampRag: this.normalizeRag(this.cell(row, 5)),
      rampArr: this.formatMoney(this.cell(row, 6)),
      rampArrRaw: this.parseRawNumber(this.cell(row, 6)),
      arr: this.formatMoney(this.cell(row, 39)),
      currentStage: this.cell(row, 7),
      currentGoLive: this.formatDate(this.cell(row, 8)),
      currentUnlock: this.formatDate(this.cell(row, 9)),
      risks: this.cell(row, 44),
      mitigationPlan: this.cell(row, 45),
      mitigationOwner: this.cell(row, 46),
      mitigationDate: this.cell(row, 47),
    };
  }

  private buildStats(projects: PsoProject[]): PsoPortfolioStats {
    const overallAtRisk = projects.filter((project) => this.isAtRisk(project.overallRag));
    const redFlagProjects = projects.filter((project) => this.isRedFlag(project));
    const amberProjects = overallAtRisk.filter((project) => !this.isRedFlag(project));
    const rampProjects = projects.filter(
      (project) => project.rampArr && project.rampArr !== 'N/A' && project.rampArr !== '$0',
    );

    const atRiskProjects = projects
      .filter((project) => this.isAtRisk(project.overallRag) || this.isRedFlag(project))
      .sort((a, b) => this.riskScore(b) - this.riskScore(a))
      .slice(0, 10);

    return {
      totalProjects: projects.length,
      atRiskCount: overallAtRisk.length,
      redCount: redFlagProjects.length,
      amberCount: amberProjects.length,
      redProjects: redFlagProjects.map((project) => project.name.split('|')[0].trim()),
      rampProjects,
      rampTotal: this.sumRampArr(rampProjects),
      projects,
      atRiskProjects,
    };
  }

  private isAtRisk(rag: string): boolean {
    return ['Red', 'Amber', 'Yellow'].includes(rag);
  }

  private isRedFlag(project: PsoProject): boolean {
    if (project.overallRag === 'Red') return true;
    if (project.overallRag === 'Green' && project.v360Rag === 'Red' && project.resourcesRag === 'Red') {
      return true;
    }
    return false;
  }

  private riskScore(project: PsoProject): number {
    let score = 0;
    if (project.overallRag === 'Red') score += 100;
    if (project.overallRag === 'Amber') score += 50;
    if (project.v360Rag === 'Red') score += 30;
    if (project.resourcesRag === 'Red') score += 25;
    if (project.schedule === 'Red') score += 20;
    if (project.quality === 'Red') score += 15;
    return score;
  }

  private sumRampArr(projects: PsoProject[]): string {
    const total = projects.reduce((sum, project) => sum + (project.rampArrRaw || 0), 0);
    if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
    if (total >= 1_000) return `$${Math.round(total / 1_000)}K`;
    return `$${total}`;
  }

  private parseRawNumber(value: string): number {
    if (!value || value === 'N/A') return 0;
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  private normalizeRag(value: string): string {
    const text = value.trim();
    if (!text || text.toUpperCase() === 'N/A') return 'N/A';
    if (/red/i.test(text)) return 'Red';
    if (/amber|yellow/i.test(text)) return 'Amber';
    if (/green/i.test(text)) return 'Green';
    return text;
  }

  private cell(row: unknown[], index: number): string {
    const value = row[index];
    if (value === undefined || value === null || value === '') return 'N/A';
    return String(value).trim();
  }

  private formatDate(value: string): string {
    if (!value || value === 'N/A') return 'N/A';
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric > 20000) {
      const parsed = XLSX.SSF.parse_date_code(numeric);
      if (parsed) {
        return new Date(parsed.y, parsed.m - 1, parsed.d).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: '2-digit',
        });
      }
    }
    return value;
  }

  private formatMoney(value: string): string {
    if (!value || value === 'N/A') return 'N/A';
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ''));
    if (Number.isNaN(numeric) || numeric === 0) return 'N/A';
    if (numeric >= 1_000_000) return `$${(numeric / 1_000_000).toFixed(2)}M`;
    if (numeric >= 1_000) return `$${Math.round(numeric / 1_000)}K`;
    return `$${numeric}`;
  }
}
