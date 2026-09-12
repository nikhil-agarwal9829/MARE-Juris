import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { matrix } = await req.json();

    if (!matrix || !matrix.businessProfile) {
      return NextResponse.json({ error: 'Invalid matrix data' }, { status: 400 });
    }

    const {
      businessProfile,
      summaryStats,
      mandatoryRequirements,
      conditionalRequirements,
      needsVerificationRequirements,
      documentChecklist,
      roadmapSteps
    } = matrix;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MARE-Juris Compliance Report</title>
        <style>
          :root {
            --navy-950: #020617;
            --navy-900: #0f172a;
            --gold-500: #d4af37;
            --gold-400: #e5c158;
            --slate-100: #f1f5f9;
            --slate-300: #cbd5e1;
            --slate-400: #94a3b8;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --red-400: #f87171;
            --amber-400: #fbbf24;
            --blue-400: #60a5fa;
            --emerald-400: #34d399;
          }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: var(--navy-950);
            color: var(--slate-100);
            line-height: 1.6;
            margin: 0;
            padding: 40px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: var(--navy-900);
            border: 1px solid var(--slate-800);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid var(--slate-800);
            padding-bottom: 30px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: var(--gold-500);
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          h1 {
            color: var(--slate-100);
            font-size: 32px;
            margin: 0 0 10px 0;
          }
          h2 {
            color: var(--gold-400);
            font-size: 20px;
            margin: 30px 0 15px 0;
            border-bottom: 1px solid var(--slate-800);
            padding-bottom: 10px;
          }
          .meta-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            color: var(--slate-400);
            font-size: 14px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: rgba(30, 41, 59, 0.5);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid var(--slate-700);
            text-align: center;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
          }
          .val-red { color: var(--red-400); }
          .val-amber { color: var(--amber-400); }
          .val-blue { color: var(--blue-400); }
          .val-emerald { color: var(--emerald-400); }
          .stat-label {
            font-size: 11px;
            color: var(--slate-400);
            text-transform: uppercase;
          }
          .req-card {
            background: rgba(30, 41, 59, 0.3);
            border: 1px solid var(--slate-700);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .req-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .req-title {
            font-size: 18px;
            font-weight: bold;
            color: var(--slate-100);
            margin: 0;
          }
          .badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .badge-mandatory { background: rgba(248, 113, 113, 0.1); color: var(--red-400); border: 1px solid rgba(248, 113, 113, 0.3); }
          .badge-conditional { background: rgba(251, 191, 36, 0.1); color: var(--amber-400); border: 1px solid rgba(251, 191, 36, 0.3); }
          .badge-verify { background: rgba(96, 165, 250, 0.1); color: var(--blue-400); border: 1px solid rgba(96, 165, 250, 0.3); }
          .req-meta {
            font-size: 12px;
            color: var(--slate-400);
            margin-bottom: 10px;
          }
          .req-desc {
            font-size: 14px;
            color: var(--slate-300);
            margin-bottom: 15px;
          }
          .authority-box {
            background: rgba(15, 23, 42, 0.8);
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
          }
          .authority-box strong { color: var(--gold-400); }
          
          .roadmap-step {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            background: rgba(30, 41, 59, 0.3);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid var(--slate-700);
          }
          .step-num {
            width: 30px;
            height: 30px;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: var(--gold-400);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
          }
          .step-content h4 { margin: 0 0 5px 0; color: var(--slate-100); }
          .step-content p { margin: 0; font-size: 13px; color: var(--slate-400); }

          .doc-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .doc-item {
            background: rgba(30, 41, 59, 0.5);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid var(--slate-700);
            font-size: 13px;
          }
          .doc-cat {
            display: block;
            font-size: 10px;
            color: var(--slate-400);
            text-transform: uppercase;
            margin-top: 4px;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: var(--slate-400);
            border-top: 1px solid var(--slate-800);
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">MARE-Juris</div>
            <h1>Statutory Compliance Roadmap</h1>
            <div class="meta-info">
              <span>Business: ${businessProfile.nameOrDesc}</span>
              <span>|</span>
              <span>Jurisdiction: ${businessProfile.jurisdictionSummary}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Mandatory</div>
              <div class="stat-value val-red">${summaryStats?.totalMandatory || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Conditional</div>
              <div class="stat-value val-amber">${summaryStats?.totalConditional || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Verification</div>
              <div class="stat-value val-blue">${summaryStats?.totalNeedsVerification || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Documents</div>
              <div class="stat-value val-emerald">${summaryStats?.totalChecklistItems || 0}</div>
            </div>
          </div>

          <h2>Execution Action Plan</h2>
          ${roadmapSteps?.map((step: any) => `
            <div class="roadmap-step">
              <div class="step-num">${step.step}</div>
              <div class="step-content">
                <h4>${step.title}</h4>
                <p>${step.desc}</p>
              </div>
            </div>
          `).join('') || '<p>No roadmap steps generated.</p>'}

          <h2>Mandatory Requirements</h2>
          ${mandatoryRequirements?.map((req: any) => `
            <div class="req-card">
              <div class="req-header">
                <h3 class="req-title">${req.title}</h3>
                <span class="badge badge-mandatory">${req.status}</span>
              </div>
              <div class="req-meta">Category: ${req.category} | Renewal: ${req.renewalPeriod}</div>
              <div class="req-desc">${req.purpose}</div>
              <div class="authority-box">
                Statutory Authority: <strong>${req.authority}</strong>
              </div>
            </div>
          `).join('') || '<p>No mandatory requirements.</p>'}

          ${conditionalRequirements && conditionalRequirements.length > 0 ? `
            <h2>Conditional Requirements</h2>
            ${conditionalRequirements.map((req: any) => `
              <div class="req-card">
                <div class="req-header">
                  <h3 class="req-title">${req.title}</h3>
                  <span class="badge badge-conditional">${req.status}</span>
                </div>
                <div class="req-meta">Category: ${req.category} | Renewal: ${req.renewalPeriod}</div>
                <div class="req-desc" style="color: var(--amber-400); font-style: italic; margin-bottom: 5px;">Condition: ${req.condition}</div>
                <div class="req-desc">${req.purpose}</div>
                <div class="authority-box">
                  Statutory Authority: <strong>${req.authority}</strong>
                </div>
              </div>
            `).join('')}
          ` : ''}

          ${needsVerificationRequirements && needsVerificationRequirements.length > 0 ? `
            <h2>Needs Verification</h2>
            ${needsVerificationRequirements.map((req: any) => `
              <div class="req-card">
                <div class="req-header">
                  <h3 class="req-title">${req.title}</h3>
                  <span class="badge badge-verify">${req.status}</span>
                </div>
                <div class="req-meta">Category: ${req.category} | Renewal: ${req.renewalPeriod}</div>
                <div class="req-desc" style="color: var(--blue-400); font-style: italic; margin-bottom: 5px;">Trigger: ${req.condition}</div>
                <div class="req-desc">${req.purpose}</div>
                <div class="authority-box">
                  Statutory Authority: <strong>${req.authority}</strong>
                </div>
              </div>
            `).join('')}
          ` : ''}

          <h2>Document Checklist</h2>
          <div class="doc-grid">
            ${documentChecklist?.map((doc: any) => `
              <div class="doc-item">
                <strong>${doc.name}</strong>
                <span class="doc-cat">${doc.category}</span>
              </div>
            `).join('') || '<p>No documents listed.</p>'}
          </div>

          <div class="footer">
            Generated by MARE-Juris Legal Intelligence Platform on ${new Date().toLocaleDateString()}<br>
            <em>Disclaimer: This report provides general legal awareness and statutory information under Indian Law. It does not constitute formal legal advice.</em>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="compliance_report.html"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate HTML report' }, { status: 500 });
  }
}
