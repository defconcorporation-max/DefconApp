# Brainstorm UI/UX – Réduire le côté "bordélique"

Proposition d’améliorations pour clarifier la hiérarchie, alléger les écrans et rendre l’app plus lisible et guidée.

---

## 1. Problèmes identifiés (pourquoi ça semble bordélique)

| Problème | Où ça se voit |
|----------|----------------|
| **Tout affiché d’un coup** | Dashboard : stats + calendrier + Kanban + tâches + activité sur une seule page, scroll infini. |
| **Hiérarchie visuelle plate** | Cartes et blocs ont le même poids (même bordure, même glow). Difficile de savoir où regarder en premier. |
| **Sidebar surchargée** | 9 liens principaux + 6 "Workspace" + Beta + Search + Sign out. Beaucoup d’entrées sans regroupement clair. |
| **Pages d’entité trop longues** | Fiche projet : statut, progrès, financier, shoots, tâches, coûts, post-prod… tout en un long défilement. |
| **Incohérence des layouts** | Padding variable (p-4, p-6, p-8), headers parfois avec sous-titre parfois sans, `pt-20` mobile pas partout. |
| **Peu de repères de contexte** | Pas de fil d’Ariane (breadcrumb), "Back to Client" discret. On ne sait pas toujours "où je suis" dans l’app. |
| **Actions dispersées** | Création rapide (FAB), Command Menu, boutons en haut de page… Plusieurs chemins pour la même chose sans priorité claire. |
| **Mobile** | Calendrier et Kanban en scroll horizontal (min-width), contenu très dense sur petit écran. |

---

## 2. Améliorations proposées

### 2.1 Dashboard : alléger et prioriser

**Objectif :** Un seul objectif "above the fold" + le reste en accès rapide.

- **Bloc principal unique**  
  Choisir **une** chose en haut : soit le **calendrier** (prochains shoots), soit un **Kanban simplifié** (clients à suivre), soit un **résumé du jour** (X shoots, Y tâches à faire). Le reste en "Voir tout →" ou onglets.

- **Stats en plus compact**  
  Remplacer les 4 grosses cartes par une **barre de KPIs** (une ligne : Projets · Shoots · Clients · À venir) ou par 2 cartes max + lien "Voir les stats".

- **Sections repliables**  
  "Calendrier", "Pipeline clients", "Tâches", "Activité" en **sections repliables** (accordéon) avec état ouvert/fermé en localStorage. L’utilisateur choisit ce qu’il garde ouvert.

- **Raccourcis contextuels**  
  En haut : "Aujourd’hui : 2 shoots · 3 tâches à faire" avec CTA "Voir le planning" / "Voir mes tâches".

**Impact :** Moins de scroll, hiérarchie claire, moins de sentiment de fouillis.

---

### 2.2 Sidebar : regrouper et simplifier

**Objectif :** Moins d’items visibles en même temps, regroupement par usage.

- **Regrouper par "flux"**  
  - **Au quotidien :** Dashboard, Shoots, Availability, Post-Production.  
  - **Clients & projets :** Leads, Clients, Projects.  
  - **Créatif :** Creative Studio, Actors (si pertinent).  
  - **Admin / Workspace :** Analytics, Team, Agencies, Users, Services, Settings.  
  Avec de petits titres de section (comme "Workspace") pour chaque groupe.

- **Réduire le nombre d’entrées visibles**  
  - Mettre **Availability** et **Post-Production** sous un seul lien "Planning" qui mène à une page avec onglets (Calendrier / Post-prod).  
  - Ou garder les deux mais avec des libellés plus courts + icônes uniquement en mode "sidebar collapsed" (option future).

- **Beta / Feedback**  
  Déplacer le bloc "Beta Testing" dans **Settings** ou en bannière discrète en haut, plutôt qu’en bas de la sidebar. Ou le remplacer par une simple icône (bulle) avec badge.

- **Quick Search (⌘K)**  
  Garder en bas de la sidebar : c’est un repère utile. Éviter d’ajouter d’autres blocs en bas (Sign out seul suffit).

**Impact :** Navigation plus lisible, moins de bruit.

---

### 2.3 Layout des pages : cohérence et repères

**Objectif :** Même structure sur toutes les pages pour que l’œil s’habitue.

- **Layout type "Page"**  
  - Une seule **zone de contenu** avec `max-width` (ex. 1400px) et **padding uniforme** : `p-4 md:p-6 lg:p-8`, et `pb-20` sur mobile si FAB.  
  - **Header de page** systématique :  
    - Fil d’Ariane (breadcrumb) : `Dashboard > Clients > Acme Corp`  
    - Titre (h1) + sous-titre optionnel (une ligne)  
    - Actions principales à droite (bouton "Créer", "Filtrer", etc.)

- **Breadcrumbs**  
  Composant réutilisable : `Dashboard` → `Clients` → `[Nom client]` → `[Nom projet]`. Cliquables. Réduit le "où suis-je ?".

- **Espacement**  
  - Même `mb-6` ou `mb-8` entre le header et le premier bloc.  
  - Même `gap-6` ou `gap-8` entre les sections.  
  Définir des tokens (ex. `--page-gap`) dans `globals.css` et les utiliser partout.

**Impact :** Moins de surprises, lecture plus rapide.

---

### 2.4 Pages "détail" (Projet, Client, Shoot) : découper en onglets ou blocs

**Objectif :** Éviter la page qui défile sans fin.

- **Onglets**  
  Ex. fiche Projet : **Vue d’ensemble** (statut, progrès, financier résumé) | **Shoots** | **Tâches** | **Coûts & facturation** | **Post-production**.  
  Une seule colonne de contenu à la fois, moins de bruit.

- **Ou sections repliables**  
  Si tu préfères garder une seule page scroll : blocs avec titre + chevron "Ouvert/Fermé", état sauvegardé (localStorage ou préférence user).  
  Par défaut : "Vue d’ensemble" + "Shoots" ouverts, le reste fermé.

- **Colonne secondaire fixe (desktop)**  
  Sur grand écran : à droite, une colonne étroite "Meta" (statut, client, dates, lien "Voir client") qui reste visible au scroll. Le reste en colonne principale.

**Impact :** Contenu lourd sans impression de mur de blocs.

---

### 2.5 Hiérarchie visuelle

**Objectif :** Différencier "ce qui compte maintenant" du "contexte".

- **Niveaux de cartes**  
  - **Niveau 1 (principal)** : une seule par zone (ex. la carte "Aujourd’hui" ou le calendrier). Bordure un peu plus marquée, ombre plus forte.  
  - **Niveau 2 (secondaire)** : cartes de liste (clients, projets). Style actuel `pro-card` ok.  
  - **Niveau 3 (tertiaire)** : listes simples, lignes, ou blocs d’info. Moins de bordure, plus discret (ex. `border-[var(--border-subtle)]` sans glow).

- **Réduire les effets au survol**  
  Éviter que toutes les cartes fassent `translateY(-4px)` + glow violet. Réserver un effet marqué aux vrais CTA (boutons, carte "Créer un client"). Le reste : léger changement de fond ou de bordure.

- **Couleur d’accent**  
  Garder le violet/indigo pour : lien actif, bouton principal, un seul CTA par écran. Ne pas l’utiliser pour tous les titres ou toutes les icônes.

**Impact :** L’œil va naturellement vers l’élément important.

---

### 2.6 Actions et création

**Objectif :** Un chemin principal clair, le reste en raccourci.

- **Création**  
  - **Principal :** Un seul type de création mis en avant par page (ex. sur `/clients` : "Nouveau client" bien visible).  
  - **FAB (Quick Create)** : garder pour les power users, mais ne pas en faire le seul moyen.  
  - **Command Menu (⌘K)** : garder "Create Client / Project / Booking" en "Quick Actions".  
  Résultat : pas de conflit, mais une action évidente par écran.

- **Boutons de page**  
  Sur les listes (Clients, Projects, Shoots) : un bouton principal en haut à droite (ex. "Nouveau client"). Style `pro-button-primary`. Les actions secondaires (export, filtre) en style plus discret (bordure, pas plein).

**Impact :** Moins d’hésitation "je clique où pour créer ?".

---

### 2.7 Mobile

**Objectif :** Moins de scroll horizontal, contenu prioritaire.

- **Dashboard mobile**  
  - Stats : 2 lignes de 2 cartes (petites) ou une seule ligne scrollable horizontale.  
  - Calendrier : vue "liste" ou "jour" par défaut au lieu d’une grille large.  
  - Kanban : soit une colonne "À faire" avec lien "Voir le board complet", soit un lien "Pipeline" qui mène au Kanban en plein écran (scroll horizontal accepté seulement là).

- **Listes**  
  Cartes clients/projets en une colonne, bien espacées. Pas de min-width qui force le scroll horizontal.

- **FAB**  
  Garder le FAB pour "Créer". S’assurer qu’il ne cache pas le CTA principal en bas de page (padding-bottom suffisant).

**Impact :** Utilisable sur téléphone sans sentiment de bricolage.

---

### 2.8 Empty states et feedback

**Objectif :** Un style unique et rassurant.

- **Empty state type**  
  Même structure partout : icône (discrète) + titre court + une phrase d’explication + un seul CTA. Réutiliser le pattern déjà utilisé sur Clients ("No Clients Yet" + "Go to Dashboard" ou "Create client").

- **Chargement**  
  Sur les listes et les pages lourdes : skeletons (cartons gris animés) au lieu de spinner seul. Même largeur/hauteur que le contenu final.

- **Toasts**  
  Déjà cohérents (react-hot-toast, style sombre). Garder les messages courts ("Client créé", "Déplacé vers Qualifié").

**Impact :** Moins d’impression de "parcours bricolé".

---

### 2.9 Petit bonus : typo et rythme

- **Titres de section**  
  Partout la même règle : `text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider` (ou une classe `.section-label`) pour "PROJECT STATUS", "DELIVERABLES PROGRESS", etc.

- **Espacement vertical**  
  Entre deux sections : `space-y-6` ou `space-y-8` constant. Éviter des `mb-4` ici et `mb-10` là.

**Impact :** Rythme de lecture plus régulier, moins de chaos visuel.

---

## 3. Ordre de mise en œuvre suggéré

| Priorité | Action | Effort |
|----------|--------|--------|
| 1 | **Layout type "Page" + breadcrumbs** (composant + l’utiliser sur 2–3 pages) | Moyen |
| 2 | **Dashboard : sections repliables** (calendrier, Kanban, tâches, activité) | Moyen |
| 3 | **Sidebar : regroupement en sections** (Au quotidien / Clients & projets / Admin) | Faible |
| 4 | **Fiche Projet (ou Client) en onglets** (Vue d’ensemble / Shoots / Tâches / …) | Moyen |
| 5 | **Hiérarchie des cartes** (niveaux 1/2/3, moins de glow partout) | Faible |
| 6 | **Dashboard : réduire stats + un bloc principal** (KPI bar ou 2 cartes) | Faible |
| 7 | **Mobile : dashboard liste/jour + listes sans min-width** | Moyen |
| 8 | **Empty states + skeletons** (composants réutilisables) | Faible |

---

## 4. Résumé en une phrase

**Réduire le bordélique = une chose importante par zone (dashboard, sidebar, page détail), un layout de page répété partout, des blocs lourds cachés derrière onglets ou accordéons, et des effets visuels réservés aux vrais CTA.**

Si tu veux, on peut commencer par implémenter le **layout type "Page" + breadcrumbs** et les **sections repliables du dashboard** en priorité.
