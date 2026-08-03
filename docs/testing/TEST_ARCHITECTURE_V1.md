# Architecture de validation — Reader V1

| | |
|---|---|
| **Type** | Document de référence — **pilotage produit** |
| **Statut** | En vigueur — 2026-08-03 (Phase T0 + Product Acceptance Suites) |
| **Périmètre** | Reader V1 = produit complet (Fabrique → consommation → expérience) |
| **Autorité** | Hiérarchie des validations, PAS et critères de jalons ; ne remplace ni contrats, ni ADR |
| **Chapitre de référence** | Item **234** — Insuffisance cardiaque — édition Collège 2022 |
| **Unité de progression** | **Product Acceptance Suite (PAS)** |

**À lire en cinq minutes :** ce document répond à trois questions — *quelle fonctionnalité produit est-elle terminée ?*, *quelle preuve automatique le prouve ?*, *qu'est-ce qui reste humain ?*

**Documents connexes :**

- Product Review : [`docs/renderer/PRODUCT-REVIEW.md`](../renderer/PRODUCT-REVIEW.md)
- État opérationnel : [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md)
- Roadmap : [`docs/MASTER_ROADMAP.md`](../MASTER_ROADMAP.md)
- Shell Reader V1 : [`docs/renderer/20-READER-V1-SHELL-ARCHITECTURE.md`](../renderer/20-READER-V1-SHELL-ARCHITECTURE.md)
- Gate local : [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh)

---

## 1. Pyramide de validation

Du socle industriel au jugement humain. **Les Product Acceptance Suites (PAS)** occupent le niveau où le produit se prononce — entre la non-régression technique et la Product Review.

```
                    ┌─────────────────────────────┐
                    │  Validation pédagogique     │  ← Future phase
                    │  (Lou — qualité d'apprentissage) │
                    └─────────────────────────────┘
                              ▲
                    ┌─────────────────────────────┐
                    │      Product Review         │  ← Humain — expérience finale
                    │  (observation produit publié) │
                    └─────────────────────────────┘
                              ▲
                    ┌─────────────────────────────┐
                    │  Product Acceptance Suites    │  ← Unité de progression roadmap
                    │  (preuve automatisée / PAS)   │
                    └─────────────────────────────┘
                              ▲
                    ┌─────────────────────────────┐
                    │    Product Smoke Tests        │  ← Implémentation des PAS
                    │  (bibliothèque + product=1)   │
                    └─────────────────────────────┘
                              ▲
         ┌────────────────────┴────────────────────┐
         │   Development / Engineering Tests       │  ← Protection du développement
         │   (mode dev, annotations, bootstrap)    │
         └────────────────────┬────────────────────┘
                              ▲
         ┌────────────────────┴────────────────────┐
         │         Contract Tests                  │  ← Validation des contrats
         └────────────────────┬────────────────────┘
                              ▲
         ┌────────────────────┴────────────────────┐
         │           Unit Tests                    │  ← Validation des composants
         └────────────────────┬────────────────────┘
                              ▲
         ┌────────────────────┴────────────────────┐
         │       Lou Build Validation              │  ← Package publié conforme
         └─────────────────────────────────────────┘
```

| Niveau | Rôle | Relation avec les PAS |
|---|---|---|
| **Lou Build Validation** | Package valide, installable | Prérequis de toute PAS |
| **Unit Tests** | Composants isolés | Alimentent les PAS ; ne les remplacent pas |
| **Contract Tests** | Obligations normatives composants | Alimentent les PAS ; ne les remplacent pas |
| **Engineering Tests** | Non-régression moteur (mode dev) | Protègent le développement ; **informatifs** pour une PAS |
| **Product Smoke Tests** | Exécution browser mode produit | **Implémentent** une ou plusieurs PAS |
| **Product Acceptance Suites** | Preuve qu'une **fonctionnalité produit** est terminée | **Colonne vertébrale de la roadmap** |
| **Product Review** | Acceptabilité humaine | Validation finale — au-delà des PAS |
| **Validation pédagogique** *(réservé)* | Qualité d'apprentissage Lou | Future phase — §8 |

**Lecture clé :** on ne pilote plus par fichier Playwright, mais par **PAS**. Les smokes, unit et contrats sont les **moyens** ; la PAS est la **fin**.

---

## 2. Philosophie de validation

### 2.1 Principes fondateurs

1. **Une fonctionnalité produit est terminée lorsqu'une Product Acceptance Suite est verte** — sur le chemin produit (`&product=1`, bibliothèque installée), avec les prérequis Lou Build en amont.

2. **Une PAS peut s'appuyer sur plusieurs suites de tests** — Product Smokes, Contract Tests, Unit Tests. Seule la PAS fait foi pour le prononcé produit ; les autres niveaux sont des non-régressions ou des fondations.

3. **Une exigence fonctionnelle possède une seule PAS autoritaire.** En cas de conflit, c'est la PAS qui tranche — pas un smoke isolé ni un test unitaire.

4. **La Product Review reste la validation humaine finale** — indispensable pour les jalons éditoriaux (Phases 7–8). Une PAS verte est nécessaire ; elle n'est pas suffisante pour le gel produit.

5. **Deux chemins, deux vérités** — le mode ingénierie (`?chapter=…` sans `product=1`) accélère le développement mais **ne prononce jamais** une PAS.

### 2.2 Rôle de chaque niveau

| Niveau | Valide | Ne prononce pas |
|---|---|---|
| **Unit Tests** | Les composants | Le produit |
| **Contract Tests** | Les contrats normatifs | L'expérience utilisateur |
| **Engineering Tests** | Le moteur en dev bootstrap | Une PAS |
| **Product Smokes** | L'exécution automatisée des PAS | L'acceptabilité humaine |
| **Product Acceptance Suites** | La fonctionnalité produit | La qualité pédagogique Lou |
| **Product Review** | L'expérience réelle | — |

### 2.3 Chaîne de confiance

```
Lou Build → Unit + Contrats → PAS vertes (via Product Smokes)
                    ↓
           Product Review (humain)
                    ↓
        Jalon éditorial / Product Freeze
```

Le gate automatisé (`validate-reader-v1.sh`) exécute l'ensemble des PAS implémentées via `test:smoke:product`, plus les fondations techniques.

---

## 3. Product Acceptance Suite (PAS)

### 3.1 Définition

Une **Product Acceptance Suite (PAS)** est :

- la **preuve automatisée** qu'une fonctionnalité produit majeure est terminée ;
- **composée** d'un ou plusieurs Product Smokes, éventuellement complétée par des Contract Tests ;
- **indépendante** de l'implémentation technique (Playwright, Node, fichiers) — ce sont des identifiants de pilotage, pas des chemins de code ;
- l'**unité de progression** de la roadmap V1 : clore une phase produit = rendre la PAS associée verte.

Une PAS **n'est pas** un fichier de test. C'est le **contrat de finition** d'une capacité produit.

### 3.2 Statuts d'une PAS

| Statut | Signification |
|---|---|
| **Couverture forte** | PAS verte de bout en bout sur le chemin produit ; prête pour Product Review |
| **Couverture partielle** | Smokes produit couvrent le moteur / le rendu nominal ; contenu éditorial ou critères complets en attente |
| **Non couverte** | Aucun Product Smoke n'implémente cette PAS ; fondations contrats ou engineering seulement |
| **Réservée** | Phase roadmap future ; PAS identifiée mais non exigible |

### 3.3 Capacités transverses (hors PAS vue)

Certaines capacités Reader **supportent** plusieurs PAS sans constituer une PAS vue :

| Capacité | Rôle | Implémentation smoke actuelle |
|---|---|---|
| Recherche locale (D6) | Transverse — navigation inter-vues | `13-local-search-d6f` |
| Préférences affichage (D7) | Transverse — confort de lecture | `14-display-preferences-d7f` |
| Reprise session (D4) | Transverse — continuité de parcours | `15-cognitive-priming-apf` AP-F-08 + tests session |
| Annotations / surlignage | Couche apprenante | Engineering `01`…`08` *(non-régression)* |
| Patrimoine export/import | Transverse — données apprenant | Contract Tests `learner-snapshot*` |

---

## 4. Catalogue des Product Acceptance Suites

### PAS-OFFLINE — Consommation produit, offline, publication

| | |
|---|---|
| **Responsabilité** | Fabrique → bibliothèque → bootstrap produit → offline → republication même `release_id` |
| **Phases roadmap** | 0, 0.1 *(clôturées)* |
| **Critères d'acceptation** | Package s'ouvre en mode produit ; 7 vues accessibles ; certification `offline_ready` ; pas de requêtes dev ; resync/republication consommable ; auto-repair digest (contrat) |
| **Implémentation actuelle** | Product Smokes `16-product-consumption` (PC-*), `12-offline-d2g` (OF-D2-*) ; Contract Test `product-consumption.test.js` |
| **Product Review** | Vérifiée implicitement à chaque Product Review ; pas de review dédiée |
| **Statut** | **Couverture forte** |

---

### PAS-SHELL — Architecture Shell Reader V1

| | |
|---|---|
| **Responsabilité** | Chrome applicatif, navigation Couche 1, barre 7 vues, actions globales, identité Lou Médecine |
| **Phases roadmap** | Parallèle Shell V1 *(spec [`20-READER-V1-SHELL-ARCHITECTURE.md`](../renderer/20-READER-V1-SHELL-ARCHITECTURE.md) §9)* |
| **Critères d'acceptation** | Critères §9 Shell V1 — chrome minimal, pas de legacy prototype, breadcrumb, panneaux transverses |
| **Implémentation actuelle** | **Indirecte seulement** — `17` CN-P-01 (7 onglets), `16` PC-01, `12` OF-D2-10 (shell cache offline), `13`/`14` (contrôles header) |
| **Product Review** | Observation chrome lors de toute Product Review |
| **Statut** | **Non couverte** — pas de PAS dédiée ; critères Shell §9 non prononcés |

---

### PAS-MM — Modèle mental

| | |
|---|---|
| **Responsabilité** | Vue « Modèle mental » — agrégation story + overview, contenu publié, figure MM |
| **Phases roadmap** | 1 *(clôturée éditorialement)* |
| **Critères d'acceptation** | Onglet Modèle mental ; contenu story + overview agrégé ; walkthrough figure-first ; navigable offline |
| **Implémentation actuelle** | Product Smoke `17` CN-P-02 ; `12` OF-D2-04 (navigation partielle) ; Engineering `10` CN-02, `03` PR-05/06 *(non-régression)* |
| **Product Review** | Phase 7 — usage réel Lou sur la vue Modèle mental |
| **Statut** | **Couverture partielle** — moteur et rendu produit OK ; validation éditoriale Phase 1 clôturée ; Product Review Lou en attente |

---

### PAS-AP — Amorçage cognitif

| | |
|---|---|
| **Responsabilité** | Vue « Amorçage cognitif » — artefact publié, profils, EDN, recherche, session, offline |
| **Phases roadmap** | 2 *(prochaine)* |
| **Critères d'acceptation** | Onglet publié ; contenu amorçage rendu ; profils Compréhension/Mémorisation ; liens EDN ; recherche vers Amorçage ; reprise session |
| **Implémentation actuelle** | Product Smoke `15-cognitive-priming-apf` (AP-F-01…12, EDN-SAME/CROSS) ; Contract Tests `cognitive-priming-*` |
| **Product Review** | Phase 7 — Lou valide l'amorçage comme produit |
| **Statut** | **Couverture forte** (capacité Reader) — Phase 2 éditoriale **prochaine** ; contenu 234 peut encore évoluer |

---

### PAS-NOTIONS — Notions

| | |
|---|---|
| **Responsabilité** | Vue « Notions » — 11 notions, figures, walkthroughs, développements, points d'attention |
| **Phases roadmap** | 3 *(réservée)* |
| **Critères d'acceptation** | Contenu notions complet éditorialement ; rendu TOC ; figures ; walkthroughs |
| **Implémentation actuelle** | Product Smoke `17` CN-P-03 *(rendu nominal mechanisms)* ; Engineering `10` CN-03 ; `12` OF-D2-04 *(navigation)* |
| **Product Review** | Phase 7 |
| **Statut** | **Couverture partielle** — smoke rendu seulement ; phase éditoriale non démarrée |

---

### PAS-CLINICAL — Cas cliniques

| | |
|---|---|
| **Responsabilité** | Vue « Cas cliniques » — raisonnement clinique, registre scénarios |
| **Phases roadmap** | 4 *(réservée)* |
| **Critères d'acceptation** | Walkthrough reasoning ; liste scénarios ; contenu éditorial complet |
| **Implémentation actuelle** | Product Smoke `17` CN-P-04 ; Engineering `10` CN-04 |
| **Product Review** | Phase 7 |
| **Statut** | **Couverture partielle** — smoke rendu seulement |

---

### PAS-COLLEGE — Collège officiel

| | |
|---|---|
| **Responsabilité** | Vue « Collège officiel » — source officielle intégrée, rendu offline |
| **Phases roadmap** | 5 *(réservée)* |
| **Critères d'acceptation** | Corps Collège visible ; offline ; dégradation gracieuse si source absente |
| **Implémentation actuelle** | Product Smoke `12` OF-D2-05 ; Engineering `10` CN-07 (planned, dev), `11-offline-dev` OF-DEV-01 |
| **Product Review** | Phase 7 |
| **Statut** | **Couverture partielle** — existence et offline ; phase éditoriale non démarrée |

---

### PAS-QCM — QCM

| | |
|---|---|
| **Responsabilité** | Vue « QCM » — liste questions depuis registre, interaction apprenant |
| **Phases roadmap** | 5–6 *(réservée)* |
| **Critères d'acceptation** | Registre QCM complet ; liste et accès aux questions |
| **Implémentation actuelle** | Product Smoke `17` CN-P-05 ; Engineering `10` CN-05 |
| **Product Review** | Phase 7 |
| **Statut** | **Couverture partielle** — liste rendue ; interaction complète non couverte par PAS dédiée |

---

### PAS-NOTES — Notes

| | |
|---|---|
| **Responsabilité** | Vue « Notes » — shell apprenant, agrégation annotations |
| **Phases roadmap** | 5 *(réservée)* |
| **Critères d'acceptation** | Shell notes visible ; pas de contenu officiel ; agrégation patrimoine |
| **Implémentation actuelle** | Product Smoke `17` CN-P-06 ; Engineering `10` CN-06 |
| **Product Review** | Phase 7 |
| **Statut** | **Couverture partielle** — shell seulement |

---

### PAS-LIBRARY — Bibliothèque EDN (Couche 1)

| | |
|---|---|
| **Responsabilité** | Écran bibliothèque — catalogue chapitres, installation, accès Couche 1 |
| **Phases roadmap** | Shell V1 / Couche 1 *(réservée)* |
| **Critères d'acceptation** | Navigation bibliothèque → chapitre ; catalogue cohérent ; hors bootstrap `product=1` direct |
| **Implémentation actuelle** | Contract Tests D1 (`library-install`, `browser-package-access`) ; **aucun Product Smoke Couche 1** |
| **Product Review** | Product Review future — parcours complet depuis bibliothèque |
| **Statut** | **Non couverte** — fondations contrats seulement |

---

## 5. Roadmap produit ↔ PAS

Chaque phase RPC 234 se clôt par la **PAS associée verte** (+ Product Review quand applicable).

| Phase | Intitulé | PAS | Statut PAS | Statut phase |
|---|---|---|---|---|
| **0** | Chaîne Fabrique → Reader | PAS-OFFLINE | Couverture forte | **Clôturée** |
| **0.1** | Fiabiliser consommation | PAS-OFFLINE | Couverture forte | **Clôturée** |
| **1** | Modèle mental | PAS-MM | Couverture partielle | **Clôturée** *(éditorial)* |
| **2** | Amorçage cognitif | PAS-AP | Couverture forte *(Reader)* | **Prochaine** |
| **3** | Notions | PAS-NOTIONS | Couverture partielle | Réservée |
| **4** | Cas cliniques | PAS-CLINICAL | Couverture partielle | Réservée |
| **5** | Collège officiel + Notes | PAS-COLLEGE, PAS-NOTES | Couverture partielle | Réservée |
| **6** | Validation intégrée | *Ensemble PAS vues + PAS-OFFLINE* | — | Réservée |
| **7** | Product Review avec Lou | *Toutes PAS + Product Review* | — | Réservée |
| **8** | Product Freeze | *Ensemble PAS vertes + Review OK* | — | Réservée |
| **9** | RPC 224 (production) | *Hors périmètre 234* | — | Réservée |
| *(parallèle)* | Shell Reader V1 | PAS-SHELL | Non couverte | En attente |
| *(parallèle)* | Bibliothèque EDN | PAS-LIBRARY | Non couverte | Réservée |

**Phase 6** ne crée pas de nouvelle PAS : elle exige l'ensemble des PAS vues vertes simultanément.

**QCM** : PAS-QCM rattachée aux phases 5–6 selon avancement éditorial.

---

## 6. Synthèse couverture PAS

| PAS | Statut | Product Smokes implémentants |
|---|---|---|
| **PAS-OFFLINE** | Couverture forte | `16-product-consumption`, `12-offline-d2g` |
| **PAS-SHELL** | Non couverte | *(indirect : `17`, `16`, `12`, `13`, `14`)* |
| **PAS-MM** | Couverture partielle | `17` CN-P-02, partiel `12` |
| **PAS-AP** | Couverture forte *(Reader)* | `15-cognitive-priming-apf` |
| **PAS-NOTIONS** | Couverture partielle | `17` CN-P-03 |
| **PAS-CLINICAL** | Couverture partielle | `17` CN-P-04 |
| **PAS-COLLEGE** | Couverture partielle | `12` OF-D2-05 |
| **PAS-QCM** | Couverture partielle | `17` CN-P-05 |
| **PAS-NOTES** | Couverture partielle | `17` CN-P-06 |
| **PAS-LIBRARY** | Non couverte | — |

**PAS transverses implicites dans le gate :** `17-product-composition-navigation` valide la **navigation inter-PAS** (7 onglets, cohérence ViewModel).

---

## 7. Ce qui n'est volontairement pas automatisé

| Élément | Raison | Niveau de validation |
|---|---|---|
| **Product Review visuelle / UX Lou** | Jugement d'usage réel | Product Review (Phase 7–8) |
| **Validation pédagogique Lou** | Métrique d'apprentissage | Future phase (§8) |
| **PAS-SHELL complète** | Shell V1 non implémenté / non prononcé | PAS-SHELL réservée |
| **PAS-LIBRARY** | Couche 1 non couverte en smoke produit | PAS-LIBRARY réservée |
| **Multi-chapitres bibliothèque** | Un seul chapitre complet (234) | Extension post-224 |
| **Contenu éditorial complet par vue** | Phases 3–5 non démarrées | PAS partielles + Product Review |
| **Sélection souris réelle (toolbar)** | Fragile en CI | Product Review si besoin |

---

## 8. Validation pédagogique — Future phase

**Statut :** emplacement réservé au sommet de la pyramide — **au-delà des PAS**.

Les PAS répondent à *« la fonctionnalité produit marche-t-elle ? »*. La validation pédagogique répondra à *« Lou apprend-elle mieux ? »* — conditionnée par Validation Corpus V1 et RPC 224 ([PDR-C8](../governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B4](../governance/PRODUCT-DECISION-REGISTRY.md)).

Aucune PAS pédagogique n'est créée en T0.

---

## 9. Prononcé des jalons

### 9.1 Jalon technique

**Question :** *les fondations et les PAS implémentées sont-elles vertes ?*

1. Lou Build Validation PASS
2. Unit + Contract Tests PASS
3. Toutes les **PAS exigées pour le lot** vertes via Product Smokes

### 9.2 Publication

**Question :** *le package publié est-il consommable ?*

1. Jalon technique (§9.1)
2. `lou-build build` PASS
3. **PAS-OFFLINE** verte sur le digest publié

### 9.3 Product Review

**Question :** *Lou accepte-t-il le produit ?*

1. Publication (§9.2)
2. Gate automatisé complet (`validate-reader-v1.sh`) vert
3. **PAS concernées** vertes pour la phase visée
4. Product Review manuelle via [`product-review-234.sh`](../../scripts/product-review-234.sh) — observation OK

**Autorité :** suprême pour Product Freeze (Phase 8).

### 9.4 Clôture d'une phase produit

**Règle :** une phase RPC se considère **techniquement clôturée** lorsque sa PAS associée (§5) est **verte** sur le package 234 en mode produit. La clôture **éditoriale** complète inclut Product Review quand la phase le requiert (Phase 7+).

---

## 10. Orchestration CI et scripts

La CI exécute les Product Smokes qui **implémentent** les PAS. Aucun changement de commande : `test:smoke:product` reste le véhicule d'exécution.

| Script | Rôle |
|---|---|
| [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh) | Gate — fondations + PAS via Product Smokes |
| [`scripts/ci-234.sh`](../../scripts/ci-234.sh) | Parité CI |
| [`scripts/product-review-234.sh`](../../scripts/product-review-234.sh) | Product Review humaine |

```bash
./scripts/validate-reader-v1.sh              # gate automatisé (PAS via smokes)
cd demo/renderer && npm run test:smoke:product   # exécution PAS
./scripts/product-review-234.sh              # validation humaine finale
```

---

## 11. Maintenance et évolution

1. **Nouvelle fonctionnalité produit** → définir ou étendre une **PAS** ; identifier les Product Smokes qui l'implémentent.
2. **Nouveau Product Smoke** → rattacher à une PAS existante — ne pas créer de smoke orphelin.
3. **Nouveau test unit/contrat/engineering** → classer comme fondation ou non-régression d'une PAS.
4. **Clôture phase roadmap** → PAS verte + Product Review si applicable.
5. **Ne pas figer de compteurs** — piloter par PAS et statuts (§3.2, §6).

---

## 12. Historique

| Version | Apport |
|---|---|
| **T0 initial** | Pyramide, séparation Product/Engineering, Product Smokes autoritaires |
| **T0 consolidé** | Pilotage produit, critères de jalons simplifiés |
| **T0 + PAS** | Product Acceptance Suites = unité de progression roadmap ; smokes = implémentation |

Commits : `e4f733c`, `69310e8`, `ac98720`.

---

*Architecture de validation Reader V1 — pilotage par Product Acceptance Suites. Non normatif technique ; autoritaire sur la hiérarchie des validations et la progression roadmap.*
