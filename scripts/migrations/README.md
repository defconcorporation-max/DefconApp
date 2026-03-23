# Migration Scripts

These scripts are one-time database migrations for the Turso/libSQL database.  
They are **not** run automatically — use them via `node scripts/migrations/<file>`.

| Script | Purpose |
|--------|---------|
| `migrate_to_turso.js` | Initial schema creation |
| `migrate_v2.js` | V2 schema updates |
| `migrate_team.js` | Team members table |
| `migrate_team_assignments.js` | Shoot-to-team assignments |
| `migrate_commissions.js` | Commissions table |
| `migrate_expenses.js` | Business expenses table |
| `migrate_project_tasks.js` | Project tasks table |
| `migrate_enhanced_tasks.js` | Task stages & enhancements |
| `migrate_task_description.js` | Task description column |
| `migrate_post_prod.js` | Post-production tables |
| `migrate_client_auth.js` | Client portal auth |
| `migrate_client_review.js` | Client review/feedback |
| `migrate_social.js` | Social media tables |
| `migrate_social_auth.js` | Social auth columns |
| `migrate_social_client_id.js` | Social client ID column |
| `migrate_users.js` | Users table |
| `migrate_invoice_status.js` | Invoice status column |
| `migrate_phase2.ts` | Phase 2 consolidated migration |

> **Note:** The consolidated `/api/migrate` route handles all schema creation idempotently for dev environments. These scripts are kept for reference.
