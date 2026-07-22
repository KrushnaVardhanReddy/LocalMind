export const templates = {
	'meeting-notes': `# Meeting Notes: [Date]

## Attendees
- [Name 1]
- [Name 2]

## Agenda
1. [Topic 1]
2. [Topic 2]

## Discussion
### [Topic 1]
- Point 1
- Point 2

### [Topic 2]
- Point A
- Point B

## Action Items
- [ ] Action 1 (Assigned to: [Name], Due: [Date])
- [ ] Action 2 (Assigned to: [Name], Due: [Date])
`,
	'technical-report': `# Technical Report: [Project Name]

## Executive Summary
A brief overview of the technical evaluation, findings, and recommendations.

## 1. Introduction
Background information on the project and the purpose of this report.

## 2. Architecture & Design
### System Overview
Description of the overall system architecture.

\`\`\`javascript
// Example Code Block
function initializeSystem() {
  console.log("System initialized.");
}
\`\`\`

## 3. Findings
| Metric | Value | Status |
|---|---|---|
| Latency | 45ms | Optimal |
| Throughput | 500 req/s | Acceptable |

## 4. Recommendations
1. First recommendation.
2. Second recommendation.
`,
	invoice: `# INVOICE
**Invoice #:** 1001
**Date:** YYYY-MM-DD
**Due Date:** YYYY-MM-DD

## From
**[Your Company Name]**
[Your Address]
[Your Email]

## To
**[Client Name]**
[Client Address]

## Description of Services

| Item | Description | Quantity | Rate | Amount |
|---|---|---|---|---|
| 1 | Web Development | 10 hrs | $100 | $1000 |
| 2 | Server Setup | 1 | $200 | $200 |

**Subtotal:** $1200
**Tax (10%):** $120
**Total Due:** $1320

## Notes
Thank you for your business! Please remit payment within 30 days.
`
};
