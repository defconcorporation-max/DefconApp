# Roadmap améliorations Defcon

## Fait (récent)

- [x] Routes API dev-only : `migrate`, `fix-*`, `migrate-agencies`, `test-db`, `test-app` → **404 en production** (`src/lib/api-dev-only.ts`).
- [x] En-têtes de sécurité globaux (`next.config.mjs`).
- [x] Cron social : refus si `CRON_SECRET` absent (503).
- [x] Package npm renommé `defcon-app`.
- [x] Sidebar : entrée **Finance** pour rôle `Admin` (aligné middleware).
- [x] Fiche client : aperçu financier (HT, paiements reçus, commissions en attente).
- [x] Fiche projet : onglet Coûts & facturation — **lignes de facturation** (catalogue + lignes libres, HT / TTC clarifié).

## En cours / récent

- [x] Extraction **services projet + catalogue** → `src/lib/actions/project-services.ts` (import direct ; pas de réexport depuis `actions.ts` — restriction Next `"use server"`).
- [x] Helpers **TPS/TVQ** → `src/lib/finance/tax.ts` + tests Vitest `tax.test.ts`.
- [x] CI GitHub Actions : **lint**, **test**, **build** (`.github/workflows/ci.yml`).

## À faire (priorisé)

### A — Sécurité & prod

- [ ] Passer `typescript.ignoreBuildErrors` à `false` et corriger les erreurs TS par vagues.
- [ ] Auditer les autres routes `api/*` (facture JSON, upload déjà authentifié).
- [ ] Rate limiting sur routes IA / upload (edge ou middleware).

### B — Finance & données

- [ ] Une seule source de vérité pour agrégats (projets / dashboard / finance).
- [ ] Réutiliser `lib/finance/tax` partout où le TTC est calculé (facture PDF, dashboard…).
- [ ] RBAC : décider si `AgencyAdmin` doit voir Finance (actuellement non).

### C — Qualité

- [ ] Découper le reste de `src/app/actions.ts` (clients, shoots, finance, social…).
- [ ] Smoke E2E login (Playwright) optionnel.

### D — UX / produit

- [ ] Portal client : parité livrables / factures.
- [ ] i18n FR/EN si besoin marché.

---

*Dernière mise à jour : mars 2025.*
