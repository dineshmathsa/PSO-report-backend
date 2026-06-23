import { Injectable } from '@nestjs/common';
import { PsoPortfolioStats, PsoProject } from './pso-excel-parser.service';

@Injectable()
export class PsoReportTemplateService {
  buildReportHtml(reportDate: string, stats: PsoPortfolioStats): string {
    return `
      <div class="report-document">
        ${this.buildExecutiveSummary(stats)}
        <div class="page-break"></div>
        ${this.buildAtRiskSection(stats.atRiskProjects)}
        <div class="page-break"></div>
        ${this.buildPortfolioSection(stats.projects)}
        <div class="page-break"></div>
        ${this.buildResourceSection(stats)}
      </div>
    `;
  }

  getReportTitle(reportDate: string): string {
    return `PSO Portfolio Health Report - ${reportDate}`;
  }

  private buildExecutiveSummary(stats: PsoPortfolioStats): string {
    const rampGreen = stats.rampProjects.filter((p) => p.rampRag === 'Green' || p.overallRag === 'Green');
    const rampAmber = stats.rampProjects.filter((p) => ['Amber', 'Yellow'].includes(p.rampRag));
    const amberDisplayCount = stats.atRiskCount - stats.redCount;

    return `
      <section class="report-section">
        <h2 class="section-title"><span class="section-number">1.</span> Executive Summary</h2>
        <p class="summary-lead">
          The PSO Portfolio remains largely stable with strong delivery momentum, but execution risks are
          concentrated in ${stats.atRiskCount} At-Risk projects (${stats.redCount} Red, ${amberDisplayCount} Amber)
          due to customer and product dependencies and testing delays. Immediate leadership focus is required on
          scope control, tightening Product-PS alignment, and aggressively rebalancing capacity to ensure the
          success of the strong Q2 pipeline.
        </p>
        <ul class="summary-list level-1">
          <li>
            <strong>At-Risk Projects:</strong> A total of ${stats.atRiskCount} out of ${stats.totalProjects} projects are At-Risk:
            <ul class="summary-list level-2">
              <li>${stats.redCount} are Red (${this.ragDots('Red')}) and ${amberDisplayCount} are Yellow (${this.ragDots('Amber')}).</li>
              <li><strong>Red Flag Projects:</strong> ${stats.redProjects.join(', ') || 'None'}.</li>
            </ul>
          </li>
          <li>
            <strong>ARR Ramp Contracts:</strong> We have ${stats.rampProjects.length} projects with ${stats.rampTotal} of Ramp.
            <ul class="summary-list level-2">
              <li>${this.formatRampList(rampGreen)} maintain a Green (${this.ragDot('Green')}) overall RAG status.</li>
              <li>${this.formatRampList(rampAmber, true)} under Yellow (${this.ragDot('Amber')}).</li>
            </ul>
          </li>
          <li>
            <strong>iMaintenance Cohort:</strong> We are tracking JK Cements, Nyrstar, SMG, Landmarc, Hexion, &amp;
            Huntsman as part of Cohort 1. All of them are going live from Mid May through Mid August.
          </li>
          <li>
            <strong>Resource Utilization &amp; Capacity Forecast:</strong> Billable utilization is stable at ~81% for the last
            four weeks, with a strong forecast of ~75% for the next four weeks. The team still has an
            imbalance with overallocated resources and under-allocated resources, alongside 6 open
            roles (with 2 staff pending joining). Capacity will be balanced by assigning the under-allocated
            resources to the 4 new pipeline projects forecasted for Q2 '26 (Westlake, Indorama, Solstice
            and 3M).
          </li>
        </ul>
        <div class="bottom-line">
          <strong>Bottom Line:</strong> Strong pipeline and delivery momentum, execution discipline on dependencies and
          capacity will ensure near-term success.
        </div>
      </section>
    `;
  }

  private buildAtRiskSection(projects: PsoProject[]): string {
    const rows = projects
      .map(
        (project) => `
        <tr>
          <td class="project-cell">${this.formatProjectName(project.name)}</td>
          <td>${this.escape(project.risks)}</td>
          <td>${this.escape(project.mitigationPlan)}</td>
          <td>${this.escape(project.mitigationOwner)}</td>
          <td>${this.escape(project.mitigationDate)}</td>
        </tr>
      `,
      )
      .join('');

    return `
      <section class="report-section">
        <h2 class="section-title"><span class="section-number">2.</span> Top 10 At-Risk Projects</h2>
        <table class="report-table at-risk-table">
          <thead>
            <tr>
              <th>Customers / Projects</th>
              <th>Risk</th>
              <th>Mitigation Plan</th>
              <th>Owner</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
    `;
  }

  private buildPortfolioSection(projects: PsoProject[]): string {
    const rows = projects
          .map(
            (project) => `
            <tr>
              <td class="project-cell">${this.formatProjectName(project.name)}</td>
              <td class="rag-cell">${this.ragDot(project.overallRag)}</td>
              <td class="rag-cell">${this.ragDot(project.customerSentiment)}</td>
              <td class="rag-cell">${this.ragDot(project.schedule)}</td>
              <td class="rag-cell">${this.ragDot(project.budget)}</td>
              <td>${this.escape(project.arr)}</td>
              <td class="rag-cell">${this.ragDot(project.v360Rag)}</td>
              <td class="rag-cell">${this.ragDot(project.rampRag)}</td>
              <td>${this.escape(project.rampArr)}</td>
              <td>${this.escape(project.currentStage)}</td>
              <td>${this.escape(project.currentGoLive)}</td>
              <td>${this.escape(project.currentUnlock)}</td>
            </tr>
          `,
          )
          .join('');

    return `
      <section class="report-section portfolio-section">
        <h2 class="section-title"><span class="section-number">3.</span> Portfolio Summary</h2>
        <table class="report-table portfolio-table">
          <thead>
            <tr>
              <th>Customers / Projects</th>
              <th>Overall RAG</th>
              <th>Customer Sentiment</th>
              <th>Schedule</th>
              <th>Budget</th>
              <th>ARR</th>
              <th>V360 RAG</th>
              <th>Ramp RAG</th>
              <th>Ramp ARR</th>
              <th>Current Stage</th>
              <th>Current GoLive</th>
              <th>Current Unlock</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
    `;
  }

  private buildResourceSection(_stats: PsoPortfolioStats): string {
    return `
      <section class="report-section">
        <h2 class="section-title"><span class="section-number">4.</span> Resource &amp; Capacity Summary</h2>
        <table class="report-table resource-table">
          <thead>
            <tr>
              <th>New Projects</th>
              <th>Billable Utilization</th>
              <th>Open Roles</th>
              <th>Forecast</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                4 Projects are being forecasted for a closure in Q2'26<br/>
                - Westlake<br/>
                - Indorama<br/>
                - Solstice<br/>
                - 3M
              </td>
              <td>
                81% is the billable Utilization for the last 4 weeks.<br/><br/>
                <strong>Overutilized Resources:</strong><br/>
                - Zubair<br/>
                - Bharath Ch<br/>
                - Nehal<br/>
                - Shaun<br/>
                - Bharath L
              </td>
              <td>
                6 open positions with 2 yet to join<br/>
                - EAM SC - 2<br/>
                - Solution Architect - 2<br/>
                - Project Manager - 1<br/>
                - IBM Maximo - 1<br/>
                - Solutions Delivery - 1<br/>
                - SAP ABAP - 1
              </td>
              <td>
                Billable forecast trends at 75% for the next 4 weeks, allocated to the In-flight projects.<br/><br/>
                <strong>Overallocated Resources:</strong><br/>
                - Kavya<br/>
                - Rajasekhar<br/>
                - Akshay<br/>
                - Mounika
              </td>
              <td>
                Billability for the last four weeks looks stable above the target. Forecast continuous to trend. The
                under-allocated resources to be assigned to these new billable projects and balance the capacity
                overload. ROMs are underway for these 4 pipeline projects for capacity planning and resource
                forecasting.<br/><br/>
                <strong>Underutilized Resources:</strong><br/>
                - Sathwik<br/>
                - Raja T<br/>
                - Shouvitra<br/>
                - Abhijith A<br/>
                - Shashi<br/>
                - Neha<br/>
                - Himanshu J<br/><br/>
                <strong>Under-allocated Resources:</strong><br/>
                - Himanshu J<br/>
                - Shashi<br/>
                - Raja T<br/>
                - Ahmed<br/>
                - Siva<br/>
                - Shekhar<br/>
                - Sourabh
              </td>
            </tr>
          </tbody>
        </table>
        <p class="resource-summary">
          PSO portfolio billable utilization falls at ~81% (last 4 weeks), with an ~75% forecast (next 4 weeks). The
          pipeline includes 2 new and 2 rollout projects forecasted in Q2 '26. Capacity remains a focus: 6 open roles
          (2 pending joining) necessitate prioritizing resource allocation based on business need and the under-allocated
          resources to be assigned.
        </p>
      </section>
    `;
  }

  private formatProjectName(name: string): string {
    const parts = name.split('|').map((part) => part.trim());
    return parts.map((part) => this.escape(part)).join('<br/>');
  }

  private formatRampList(projects: PsoProject[], short = false): string {
    if (projects.length === 0) return short ? 'No amber ramp projects identified' : 'No green ramp projects identified';
    return projects
      .map((project) => {
        const label = project.name.split('|')[0].trim();
        return `${label} (${project.rampArr})`;
      })
      .join(', ');
  }

  private ragDot(rag: string): string {
    if (rag === 'Red') return '<span class="rag-circle red" title="Red"></span>';
    if (rag === 'Amber') return '<span class="rag-circle amber" title="Amber"></span>';
    if (rag === 'Green') return '<span class="rag-circle green" title="Green"></span>';
    return '<span class="na">N/A</span>';
  }

  private ragDots(rag: 'Red' | 'Amber' | 'Green'): string {
    return this.ragDot(rag);
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
  }
}
