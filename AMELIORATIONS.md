# Rapport d'analyse et d'améliorations – Defcon App

Analyse globale de l'application et propositions d'améliorations, modifications et corrections.

---

## 1. Synthèse du projet

| Élément | Technologie |
|--------|-------------|
| **Framework** | Next.js 16 (App Router) |
| **Langage** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS, Framer Motion, Recharts |
| **Auth** | NextAuth v5 (Credentials + Facebook, LinkedIn, Google, TikTok) |
| **Base de données** | Turso (libSQL) |
| **Stockage** | Vercel Blob |

**Points forts :** App Router bien utilisé, auth et RBAC centralisés, SQL paramétré (pas d'injection), stack UI moderne, thème sombre cohérent.

---

## 2. Corrections déjà appliquées (cette session)

- **`/api/reset-admin`** : Désactivé en production (404). En dev, protection par header `X-Reset-Admin-Secret` si `RESET_ADMIN_SECRET` est défini.
- **`AUTH_SECRET`** : Obligatoire en production dans `auth.ts` et `auth-utils.ts` (erreur au démarrage si absent).
- **`/api/upload`** : Vérification de session (`auth()`) ; retour 401 si non connecté.
- **`src/app/actors/[id]/error.tsx`** : En production, message générique (pas de détail d’erreur ni suggestion `/api/migrate`). En dev, message technique conservé.
- **Routes AI** : `api/generate-idea`, `api/analyze-competitor`, `api/generate-postprod-notes` exigent désormais une session (`auth()`), sinon 401.

---

## 3. Sécurité – À faire en priorité

### 3.1 Routes API à protéger (reste à faire)

| Route | Risque | Action recommandée |
| `api/migrate` (GET) | Modification du schéma en prod | Vérifier `NODE_ENV !== 'production'` ou header secret (ex. `X-Migrate-Secret`). **À faire.** |
| `api/migrate-agencies`, `api/fix-team-schema`, `api/fix-team-schema-force`, `api/fix-shoots-schema` | Idem | Même logique que migrate |
| `api/test-db`, `api/test-app` | Fuite d’infos en prod | Désactiver en production ou protéger par secret |

**Exemple pour une route AI :**

```ts
// Au début du handler POST
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3.2 Variables d’environnement

- **Turso** : Dans `src/lib/turso.ts`, éviter un fallback vers une URL/token fictifs en production. Vérifier `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` au démarrage si `NODE_ENV === 'production'`.

---

## 4. Qualité de code et outillage

### 4.1 TypeScript

- **Fichier :** `next.config.mjs`  
- **Problème :** `typescript: { ignoreBuildErrors: true }` masque les erreurs de typage.  
- **Action :** Supprimer cette option et corriger les erreurs TypeScript (idéalement avant chaque déploiement).

### 4.2 ESLint

- **Fichier :** `eslint.config.mjs`  
- **Problème :** `ignores: ["**/*"]` désactive tout le lint.  
- **Action :** Réactiver ESLint au moins sur `src/` (ex. `eslint-config-next`) et traiter les avertissements progressivement.

### 4.3 Fichier `actions.ts`

- **Fichier :** `src/app/actions.ts` (très volumineux).  
- **Action :** Découper par domaine, par exemple :
  - `src/app/actions/clients.ts`
  - `src/app/actions/shoots.ts`
  - `src/app/actions/projects.ts`
  - `src/app/actions/tasks.ts`
  - etc.  
  Garder un barrel `actions/index.ts` qui réexporte pour limiter les changements d’imports.

### 4.4 Client Turso unique

- **Fichiers :** `src/lib/audit.ts`, `src/app/profitability-actions.ts`, `src/app/scheduling-actions.ts` créent leur propre client Turso.  
- **Action :** Utiliser partout le client partagé `@/lib/turso` pour une seule configuration et de meilleures garanties (connexions, timeouts).

---

## 5. Résilience et erreurs

- **Layout** : En cas d’échec de `getClients` / `getAgencies`, un message utilisateur minimal (ex. “Données temporairement indisponibles”) peut améliorer la compréhension.
- **Error boundaries** : Étendre le pattern utilisé dans `src/app/actors/[id]/error.tsx` à d’autres routes sensibles (dashboard, projets, shoots) pour une gestion d’erreur homogène.
- **Pages** : Éviter d’exposer des messages d’erreur bruts ou des chemins internes (comme `/api/migrate`) en production.

---

## 6. Accessibilité (a11y)

- Ajouter des attributs `aria-*`, `role` et des labels sur les formulaires et modales.
- S’assurer que les images ont un `alt` pertinent.
- Vérifier la navigation au clavier (Sidebar, CommandMenu, modales).

---

## 7. Tests

- **État actuel :** Pas de suite de tests (Jest/Vitest) ni de tests E2E actifs dans `src/`.  
- **Recommandation :**
  - Tests unitaires sur les Server Actions critiques (création/mise à jour clients, shoots, projets).
  - Tests E2E (ex. Playwright) sur les parcours principaux : login, dashboard, création de projet/shoot.

---

## 8. Migrations et scripts

- Plusieurs scripts de migration à la racine (`migrate_*.js`, `seed_admin.js`, etc.) et routes API dédiées (`migrate`, `fix-*`).  
- **Recommandation :** Centraliser les migrations (versioning de schéma, un point d’entrée) et documenter dans un README ou un fichier `docs/migrations.md` quelles routes/scripts sont réservés au dev ou à des opérations manuelles sécurisées.

---

## 9. Divers

- **Nom du package** : `package.json` utilise encore un nom générique (`temp_app`). Mettre à jour vers un nom cohérent avec le projet (ex. `defcon-console`).
- **i18n** : Pas de lib d’internationalisation ; certaines chaînes sont en français, d’autres en anglais. Si une version multilingue est prévue, introduire une stratégie (ex. `next-intl`) et éviter les chaînes en dur dans les prompts API.

---

## 10. Ordre de priorité suggéré

1. **Critique (déjà fait)** : reset-admin, AUTH_SECRET, upload, error actors.
2. **Haute** : Protéger les routes AI et migrate/fix-* (auth ou secret + blocage en prod).
3. **Haute** : Réactiver les erreurs TypeScript et corriger les types.
4. **Moyenne** : Réactiver ESLint, découper `actions.ts`, client Turso unique.
5. **Moyenne** : Durcir les messages d’erreur et étendre les error boundaries.
6. **Basse** : Accessibilité, tests, migrations documentées, i18n.

---

*Rapport généré à partir de l’analyse du dépôt. Les corrections de la section 2 ont été appliquées dans le code.*
