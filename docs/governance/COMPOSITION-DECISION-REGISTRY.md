# Registre de décisions — Couche de composition

| | |
|---|---|
| **Type** | Registre de gouvernance — **informatif** |
| **Statut** | Décisions retenues — 2026-07-28 |
| **Contexte** | Audit indépendant frontière Fabrique ↔ Reader ; formalisation pré-implémentation |
| **Contrat normatif issu** | [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) |

Ce registre consolide les décisions d'architecture retenues, rejetées ou différées avant gel de la couche de composition. Il ne remplace pas le contrat composant.

---

## D1 — Couche de composition

| | |
|---|---|
| **Décision retenue** | La **composition** devient une **responsabilité contractuelle explicite** du Reader, distincte du Renderer et de la consommation du manifest. |
| **Énoncé normatif** | La composition **traduit** les unités de production publiées en unités d'expérience du Reader, **sans créer ni modifier** de contenu médical. |
| **Décision rejetée** | Absorber la composition dans le Renderer (statu quo implicite du prototype `demo/renderer/`). |
| **Décision différée** | Aucune. |
| **Justification** | Le doc 16 §4.1 l'exige déjà ; l'audit a montré que l'absence de propriétaire contractuel provoque une fuite du vocabulaire produit vers le package (`label` dans `projections.yaml`). Une responsabilité diffuse devient une seconde autorité pédagogique non versionnée. |
| **Impact documentaire** | Création de `COMPOSITION-COMPONENT-CONTRACT.md` ; amendements ciblés des contrats 04, 06, RCC, docs 14–17. |
| **Impact futur sur le code** | Extraction d'un module « Composition Engine » ; `app.js` / `renderer.buildProjectionTabs()` migrent vers la composition ; le Renderer ne consomme plus le manifest directement pour la navigation. |
| **Caractère** | **Normatif** (via le contrat composant). |

---

## D2 — Composition Specification

| | |
|---|---|
| **Décision retenue** | Une **Composition Specification** déclarative, **versionnée** et **propriété du Reader**, décrit les vues cognitives, leurs libellés, leur ordre d'affichage, les projections ou identités consommées, les règles d'agrégation et le comportement en cas d'absence. |
| **Décision rejetée** | Porter les libellés d'onglets et l'ordre d'affichage dans `projections.yaml` ou le manifest. |
| **Décision différée** | Format de sérialisation figé (YAML, JSON, autre) — le contrat reste indépendant du format. |
| **Justification** | Doc 16 §6.2 exige une composition auditable sans lecture du code. Le package médical ne doit pas porter de vocabulaire produit (doc 16 §6.3, doc 17 §8.1). |
| **Impact documentaire** | §4 du contrat de composition ; interdiction explicite dans le contrat 04 §10.3. |
| **Impact futur sur le code** | Nouveau répertoire de spécifications (ex. `demo/renderer/composition/`) ; retrait de `label` de `projections.yaml` et de `assembleManifest`. |
| **Caractère** | **Normatif** (structure et obligations) ; emplacement et format de fichier **informatifs** jusqu'à implémentation. |

---

## D3 — Reading View Model

| | |
|---|---|
| **Décision retenue** | Le résultat d'exécution de la composition est un **Reading View Model** — objet **calculé en mémoire**, **sans autorité propre**, **non publié** par La Fabrique, **normalement non persisté**, constituant l'**interface logique Reader → Renderer**. |
| **Chaîne retenue** | `Composition Specification + Manifest publié → Composition Engine → Reading View Model → Renderer → DOM` |
| **Décision rejetée** | Faire du View Model une entrée de publication ou une source de vérité persistée. |
| **Décision différée** | Schéma de sérialisation du View Model pour tests et fixtures — laissé à l'implémentation. |
| **Justification** | Sépare la règle (spec) de l'exécution (runtime) ; permet de tester le Renderer sans package ; respecte le principe manifest-only en amont. |
| **Impact documentaire** | §5 du contrat de composition ; amendement RCC §4 (entrées Renderer) et §7 (responsabilités logiques). |
| **Impact futur sur le code** | Type/objet `ReadingViewModel` ; Renderer refactoré pour consommer le View Model ; tests unitaires de composition sans navigateur. |
| **Caractère** | **Normatif** (rôle et invariants) ; détail de schéma **informatif** sauf champs minimaux du contrat. |

---

## D4 — Vocabulaire produit dans le package

| | |
|---|---|
| **Décision retenue** | Les éléments suivants **appartiennent au Reader** (Composition Specification), **pas** au Chapter Package publié : libellés d'onglets / vues, emojis, ordre d'affichage des vues, nomenclature purement produit, règles de navigation. |
| **Distinction retenue** | **Ordre pédagogique** des éléments ou projections (`order` dans le registre) → propriété du Blueprint / package. **Ordre d'affichage des vues** (`displayOrder`) → propriété de la Composition Specification. |
| **Décision rejetée** | Continuer à recopier `label` dans le manifest via `assembleManifest`. |
| **Décision différée** | Migration rétroactive des manifests déjà générés — lors de la phase d'implémentation ; le contrat interdit la pratique à partir de sa date d'entrée en vigueur. |
| **Justification** | Violation mesurable aujourd'hui (`projections.yaml` → `manifest.json` → `config.projectionTabLabel`). À l'échelle, renommer une vue exigerait un rebuild médical. |
| **Impact documentaire** | Contrat 04 §10.3 ; contrat 06 §1 ; doc 17 §8.1 renforcé. |
| **Impact futur sur le code** | Retrait `label` de `package.js` ; retrait `projectionTabLabel` fallbacks ; `known_absent` recentré sur familles de production, pas sur ids d'onglets produit. |
| **Caractère** | **Normatif**. |

---

## D5 — Structure des blocs pédagogiques

| | |
|---|---|
| **Option A — Artefact structuré publié** | La Fabrique publie explicitement la séquence des blocs pédagogiques. |
| **Option B — Convention syntaxique validée** | La Fabrique continue à publier le Markdown actuel ; une **gate de build** vérifie formellement la convention (frontières `<h2 id>`, identités, ordre). |
| **Décision retenue** | **Option B** comme baseline normative. |
| **Décision différée** | **Option A** — réévaluable si la gate B s'avère insuffisante pour l'agrégation multi-projection ou la stabilité des ancres à grande échelle. |
| **Justification** | Option B est la **moins invasive** : aucun nouvel artefact publié, pipeline inchangé en sortie, principe de publication minimale respecté. Elle garantit le **déterminisme** (convention vérifiée, pas heuristique silencieuse), la **stabilité des ancres apprenantes** (structure prévisible) et l'**absence de reconstruction heuristique non diagnostiquée** — la composition applique une règle publiée et validée, pas une inférence. |
| **Impact documentaire** | Contrat de composition §5 (résolution des blocs) ; mention informative dans doc 19 (future gate) — **hors périmètre de ce registre** pour le détail pipeline. |
| **Impact futur sur le code** | Gate build « block structure » ; `blocks.js` consomme des blocs résolus par la composition (plus de heuristique seule) ; tests de conformité Markdown. |
| **Caractère** | **Normatif** (interdiction de heuristique silencieuse) ; détail de la gate **informatif** jusqu'à spécification pipeline. |

---

## D6 — Catalogue de corpus

| | |
|---|---|
| **Décision retenue** | Le **catalogue global** des chapitres (`library.json` ou équivalent) est **nécessaire avant le passage à plusieurs spécialités**, mais **explicitement exclu** du contrat de composition. |
| **Décision rejetée** | Inclure le catalogue dans le contrat de composition (mélange de responsabilités). |
| **Décision différée** | Contrat composant « Library / Catalog Access » — après implémentation multi-chapitres ; mentionné dans `PROJECT_STATE.md` comme chantier actif. |
| **Justification** | Doc 14 Couche 1 (Bibliothèque) est une responsabilité Reader distincte de la composition par chapitre. Doc 17 §3.2 consomme par package, pas par scan de répertoire. |
| **Impact documentaire** | Aucun dans le contrat de composition ; note dans ce registre et rapport final. |
| **Impact futur sur le code** | Artefact `library.json` ou index publié au niveau corpus ; module Package Access / Library — séparé de Composition Engine. |
| **Caractère** | **Informatif** (planification) ; futur contrat séparé **normatif** quand implémenté. |

---

## Synthèse

| ID | Décision | Statut |
|---|---|---|
| D1 | Composition = responsabilité explicite du Reader | **Retenu — normatif** |
| D2 | Composition Specification versionnée, hors package | **Retenu — normatif** |
| D3 | Reading View Model = interface Reader → Renderer | **Retenu — normatif** |
| D4 | Vocabulaire produit hors package | **Retenu — normatif** |
| D5 | Blocs : gate convention Markdown (Option B) | **Retenu — normatif** ; Option A différée |
| D6 | Catalogue corpus | **Différé** — contrat séparé futur |
