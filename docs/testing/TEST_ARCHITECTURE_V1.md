# Architecture de validation — Reader V1

| | |
|---|---|
| **Type** | Document de référence — **pilotage produit** |
| **Statut** | **Framework consolidé — stable + AAI** (2026-08-03) |
| **Périmètre** | Reader V1 = produit complet (Fabrique → consommation → expérience) |
| **Autorité** | Hiérarchie des validations, PAS et critères de jalons ; ne remplace ni contrats, ni ADR |
| **Chapitre de référence** | Item **234** — Insuffisance cardiaque — édition Collège 2022 |
| **Unité de progression** | **Product Acceptance Suite (PAS)** |

**À lire en cinq minutes :** ce document répond à quatre questions — *quelle fonctionnalité produit est-elle terminée ?*, *quels invariants d'architecture sont garantis ?*, *quelle preuve automatique le prouve ?*, *qu'est-ce qui reste humain ?*

**Registre officiel des PAS :** le [§4](#4-catalogue-des-product-acceptance-suites) est la **source unique** de définition des Product Acceptance Suites (responsabilité, critères d'acceptation, lien roadmap). Les **invariants d'architecture (AAI)** y sont déclarés et cartographiés au [§6.2](#62-registre-aai--pas--invariants--validations). Il n'existe pas de catalogue séparé — vision et séquence dans [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md), état d'avancement dans [`PROJECT_STATE.md`](../PROJECT_STATE.md), preuves automatisées au [§6](#6-cartographie-pas--validations).

**Documents connexes :**

- Product Review : [`docs/renderer/PRODUCT-REVIEW.md`](../renderer/PRODUCT-REVIEW.md)
- État opérationnel : [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md)
- Roadmap : [`docs/MASTER_ROADMAP.md`](../MASTER_ROADMAP.md)
- Shell Reader V1 : [`docs/renderer/20-READER-V1-SHELL-ARCHITECTURE.md`](../renderer/20-READER-V1-SHELL-ARCHITECTURE.md)
- Gate local DEV : [`scripts/validate-dev.sh`](../../scripts/validate-dev.sh)
- Gate local RELEASE : [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh)

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

1. **Une fonctionnalité produit est terminée lorsqu'une Product Acceptance Suite est verte** — sur le chemin produit (`&product=1`, bibliothèque installée), avec les prérequis Lou Build en amont. Une PAS **n'est pas verte** si l'un de ses **Architectural Acceptance Invariants (AAI)** est rouge ([§3.4](#34-architectural-acceptance-invariants-aai)).

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

Le gate **RELEASE** (`validate-reader-v1.sh`) exécute l'ensemble des PAS implémentées via `test:smoke:product`, plus les fondations techniques.

### 2.4 Niveaux DEV, PAS et RELEASE

Trois gates opérationnels — **sans ambiguïté** sur quoi lancer, quand et pourquoi.

| Niveau | Question | Autorité | Quand lancer |
|---|---|---|---|
| **DEV** | Le moteur Reader tient-il après ma modification ? | Non-régression technique | À chaque modification Reader / Renderer |
| **PAS** | La PAS visée est-elle terminée ? | **Prononcé produit** pour la PAS concernée | Clôture d'un incrément PAS (ex. PAS-SHELL S2) |
| **RELEASE** | Le package 234 est-il publiable et non-régressif ? | Gate CI + pré-Product Review | Avant merge `main`, publication, Product Review |

| Niveau | Commande | Contenu |
|---|---|---|
| **DEV** | [`scripts/validate-dev.sh`](../../scripts/validate-dev.sh) | Unit tests Renderer + Engineering Smokes |
| **PAS** | Voir §6 — gate ciblé par PAS | Lou Build validate + Product Smokes de la PAS + fondations associées |
| **RELEASE** | [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh) | Fabrique + contrats + unit + **toutes** Product Smokes + Engineering Smokes |
| **Humain** | [`scripts/product-review-234.sh`](../../scripts/product-review-234.sh) | Observation produit publié — **après** RELEASE vert |

**Règles :**

1. **DEV ne prononce jamais une PAS** — il accélère le développement courant.
2. **PAS ne remplace pas RELEASE** — une PAS verte locale n'autorise pas la publication sans gate RELEASE complet.
3. **RELEASE ne remplace pas Product Review** — jugement humain final pour les jalons éditoriaux.
4. Le mode ingénierie (`?chapter=` sans `product=1`) n'entre que dans **DEV** — jamais dans PAS ni RELEASE.

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

### 3.4 Architectural Acceptance Invariants (AAI)

Les **Architectural Acceptance Invariants (AAI)** sont la **première couche de validation** de chaque PAS. Ils protègent les frontières structurelles du Reader — indépendamment du rendu nominal ou du comportement fonctionnel observé en smoke.

**Définition :**

- Chaque PAS possède **un ou plusieurs invariants d'architecture** — propriétés qui doivent rester vraies quelle que soit l'évolution du contenu éditorial ou des capacités produit.
- Chaque invariant **doit** être protégé par **au moins un test autoritaire** (Product Smoke, Contract Test ou Unit Test de fondation — jamais un Engineering Smoke seul).
- Une PAS **ne peut pas être déclarée verte** si un AAI associé est rouge — même lorsque les critères fonctionnels d'acceptation passent.

**Relation avec la pyramide existante :**

```
AAI (invariant architectural)
        ↓ protégé par
Fondations (unit / contrats) + Product Smokes (comportement produit)
        ↓ composent
PAS (prononcé produit)
```

Les AAI **ne créent pas** une nouvelle famille de tests. Ils **réorganisent l'autorité** : une PAS devient simultanément le registre de la fonctionnalité produit **et** le registre des invariants d'architecture qu'elle garantit.

**Incident fondateur (2026-08-03) :** le conflit Service Worker ↔ préparation offline a été détecté en Product Review, non par les batteries existantes, car les tests validaient le **comportement** (consommation, republication, passthrough unitaire) mais pas l'**invariant** « le Service Worker ne doit jamais empêcher la préparation d'une release » sur le chemin d'exécution réel du navigateur. Voir [§6.3](#63-backlog-aai--invariants-non-couverts).

**Statuts AAI :**

| Statut | Signification |
|---|---|
| **Couvert** | Au moins un test autoritaire vérifie explicitement l'invariant |
| **Partiel** | Des fondations existent ; le chemin d'exécution critique (browser réel, SW actif, cycle republier→reconsulter) n'est pas entièrement protégé |
| **Non couvert** | Aucune validation autoritaire n'asserte l'invariant |

---

## 4. Catalogue des Product Acceptance Suites

### PAS-OFFLINE — Consommation produit, offline, publication

| | |
|---|---|
| **Responsabilité** | Fabrique → bibliothèque → bootstrap produit → offline → republication même `release_id` |
| **Phases roadmap** | 0, 0.1 *(clôturées)* |
| **Critères d'acceptation** | Package s'ouvre en mode produit ; 7 vues accessibles ; certification `offline_ready` ; pas de requêtes dev ; resync/republication consommable ; auto-repair digest (contrat) |
| **Invariants AAI** | [AAI-OFF-01](#62-registre-aai--pas--invariants--validations) SW n'empêche jamais la préparation ; [AAI-OFF-02](#62-registre-aai--pas--invariants--validations) `release_id` stable ; [AAI-OFF-03](#62-registre-aai--pas--invariants--validations) digest = vérité matérielle |
| **Implémentation actuelle** | Product Smokes `16-product-consumption` (PC-*), `12-offline-d2g` (OF-D2-*) ; Contract Test `product-consumption.test.js` ; passthrough SW `browser-offline-sw-passthrough.test.js` (PC-05) |
| **Product Review** | Vérifiée implicitement à chaque Product Review ; pas de review dédiée |
| **Statut** | **Couverture forte** |

---

### PAS-SHELL — Architecture Shell Reader V1

| | |
|---|---|
| **Responsabilité** | Chrome applicatif, navigation Couche 1, barre 7 vues, actions globales, identité Lou Médecine |
| **Phases roadmap** | Parallèle Shell V1 *(spec [`20-READER-V1-SHELL-ARCHITECTURE.md`](../renderer/20-READER-V1-SHELL-ARCHITECTURE.md) §9)* |
| **Critères d'acceptation** | Critères §9 Shell V1 — chrome minimal, pas de legacy prototype, breadcrumb, panneaux transverses |
| **Invariants AAI** | [AAI-SHL-01](#62-registre-aai--pas--invariants--validations) Shell ignore le contenu pédagogique ; [AAI-SHL-02](#62-registre-aai--pas--invariants--validations) Composition ignore le Shell ; [AAI-SHL-03](#62-registre-aai--pas--invariants--validations) ReadingViewModel = interface unique |
| **Implémentation actuelle** | **S1 livré (partiel)** — `shell-s1-chrome.test.js` (chrome legacy) ; indirect : `17` CN-P-01, `16` PC-01, `13`/`14` (header) ; S2+ (breadcrumb, Couche 1) en attente |
| **Gate PAS ciblé** | `npm test` (shell-s1) + smokes `17`, `16`, `13`, `14` — voir §6 |
| **Product Review** | Observation chrome lors de toute Product Review |
| **Statut** | **Couverture partielle** — S1 chrome minimal OK ; critères §9 complets non prononcés |

---

### PAS-MM — Modèle mental

| | |
|---|---|
| **Responsabilité** | Vue « Modèle mental » — agrégation story + overview, contenu publié, figure MM |
| **Phases roadmap** | 1 *(clôturée éditorialement)* |
| **Critères d'acceptation** | Onglet Modèle mental ; contenu story + overview agrégé ; walkthrough figure-first ; navigable offline |
| **Invariants AAI** | [AAI-MM-01](#62-registre-aai--pas--invariants--validations) vue entièrement alimentée par le ReadingViewModel |
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
| **Invariants AAI** | [AAI-AP-01](#62-registre-aai--pas--invariants--validations) amorçage provient uniquement du package publié |
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
| **Invariants AAI** | [AAI-NOT-01](#62-registre-aai--pas--invariants--validations) la vue ne dépend jamais du chrome |
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
| **Invariants AAI** | [AAI-CLIN-01](#62-registre-aai--pas--invariants--validations) les cas proviennent uniquement du package |
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
| **Invariants AAI** | [AAI-COL-01](#62-registre-aai--pas--invariants--validations) le texte officiel reste inchangé |
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
| **Invariants AAI** | [AAI-QCM-01](#62-registre-aai--pas--invariants--validations) les QCM affichés proviennent uniquement du package |
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
| **Invariants AAI** | [AAI-NTE-01](#62-registre-aai--pas--invariants--validations) les notes utilisateur ne modifient jamais le package |
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
| **Invariants AAI** | [AAI-LIB-01](#62-registre-aai--pas--invariants--validations) le Reader ne dépend jamais d'un chapitre codé en dur |
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
| *(parallèle)* | Shell Reader V1 | PAS-SHELL | Couverture partielle *(S1)* | En cours |
| *(parallèle)* | Bibliothèque EDN | PAS-LIBRARY | Non couverte | Réservée |

**Phase 6** ne crée pas de nouvelle PAS : elle exige l'ensemble des PAS vues vertes simultanément.

**QCM** : PAS-QCM rattachée aux phases 5–6 selon avancement éditorial.

---

## 6. Cartographie PAS ↔ validations

Matrice autoritaire : **quelle preuve prononce quelle PAS**. Piloter par cette table — pas par fichiers de test isolés.

| PAS | Statut | Gate PAS (commande ciblée) | Product Smokes | Fondations (unit / contrats) | Engineering *(DEV)* |
|---|---|---|---|---|---|
| **PAS-OFFLINE** | Couverture forte | `lou-build validate` + `playwright test 12 16` | `12-offline-d2g`, `16-product-consumption` *(PC-05 SW actif)* | `product-consumption.test.js`, `browser-offline-sw-passthrough.test.js`, `browser-offline-*`, `offline-runtime.test.js`, lou-build `test:ci` | `11-offline-dev` |
| **PAS-SHELL** | Couverture partielle *(S1)* | `npm test` *(shell-s1)* + smokes `17` `16` `13` `14` | `17` CN-P-01, `16` PC-01, `13`, `14` *(header)* | `shell-s1-chrome.test.js` | — |
| **PAS-MM** | Couverture partielle | smoke `17` CN-P-02 | `17` CN-P-02 ; partiel `12` OF-D2-04 | `composition-*`, `10` CN-02 *(dev)* | `10` CN-02, `03` PR-05/06 |
| **PAS-AP** | Couverture forte *(Reader)* | smoke `15` | `15-cognitive-priming-apf` | `cognitive-priming-*`, `session-*` | — |
| **PAS-NOTIONS** | Couverture partielle | smoke `17` CN-P-03 | `17` CN-P-03 | `composition-*` | `10` CN-03 |
| **PAS-CLINICAL** | Couverture partielle | smoke `17` CN-P-04 | `17` CN-P-04 | `composition-*` | `10` CN-04 |
| **PAS-COLLEGE** | Couverture partielle | smoke `12` OF-D2-05 | `12` OF-D2-05 | `college-official.test.js` | `10` CN-07, `11-offline-dev` |
| **PAS-QCM** | Couverture partielle | smoke `17` CN-P-05 | `17` CN-P-05 | `composition-*` | `10` CN-05 |
| **PAS-NOTES** | Couverture partielle | smoke `17` CN-P-06 | `17` CN-P-06 | `composition-*`, patrimoine | `10` CN-06 |
| **PAS-LIBRARY** | Non couverte | — *(réservée S3+)* | — | `browser-package-access`, `library-install` (lou-build) | — |

**Capacités transverses** (supportent plusieurs PAS, ne sont pas des PAS vue) :

| Capacité | Product Smoke | Fondations | PAS supportées |
|---|---|---|---|
| Recherche locale (D6) | `13-local-search-d6f` | `local-search-*` | Toutes vues |
| Préférences affichage (D7) | `14-display-preferences-d7f` | `display-preferences-*` | Toutes vues |
| Reprise session (D4) | `15` AP-F-08 | `session-*` | PAS-AP, navigation |
| Annotations / surlignage | — | Engineering `01`…`08` | Couche apprenante *(DEV)* |
| Patrimoine export/import | — | `learner-snapshot*` | PAS-NOTES, transverse |

**Gate PAS complet** (toutes PAS implémentées) = `npm run test:smoke:product` après `lou-build validate` + sync fixture.

### 6.1 Doublons intentionnels — non supprimés

| Paire | Raison de coexistence |
|---|---|
| `10-composition-navigation` (engineering) vs `17-product-composition-navigation` (product) | **Deux chemins distincts** : dev bootstrap (`CHAPTERS_ROOT`) vs chemin produit (`product=1`). Seul `17` prononce les PAS vue ; `10` protège le DEV. |
| Unit tests + Product Smokes (même domaine) | Units = fondation isolée ; Smokes = intégration browser chemin produit. |
| `*-validation.test.js` (Node) + `*-d*f.spec.mjs` (Playwright) | Node = logique service ; Playwright = UX browser produit. |

Aucun doublon supprimé : chaque paire sert un **niveau d'autorité différent** (§2.4).

### 6.2 Registre AAI — PAS → invariants → validations

Registre autoritaire des **Architectural Acceptance Invariants**. Une PAS dont un AAI est **Non couvert** ou **Partiel** sur un invariant critique ne peut pas être prononcée **Couverture forte** sans backlog explicite ([§6.3](#63-backlog-aai--invariants-non-couverts)).

| ID | PAS | Invariant | Statut | Validations autoritaires existantes |
|---|---|---|---|---|
| **AAI-OFF-01** | PAS-OFFLINE | Le Service Worker **ne doit jamais empêcher** la préparation d'une release | **Couvert** | `browser-offline-sw-passthrough.test.js` ; `offline-runtime.test.js` (network-first shell, cache fallback offline) ; `16` PC-05, **AAI-OFF-01-A/B** ; `12` OF-D2-10, **OF-D2-11** ; `sw.js` bypass header + activate shell refresh ; `app.js` `controllerchange` reload |
| **AAI-OFF-02** | PAS-OFFLINE | Le `release_id` **reste stable** pendant la construction d'une release | **Couvert** | `tools/lou-build/test/release-identity.test.js` ; `library-install.test.js` (rejet `release_id` incohérent) ; `16` PC-02 (republication même `release_id`) ; `sync-reader-fixture.test.js` |
| **AAI-OFF-03** | PAS-OFFLINE | Le `content_digest` est la **vérité matérielle** — divergence = rejet ou réparation | **Couvert** | `offline-runtime.test.js` ; `product-consumption.test.js` ; `browser-offline-stale.test.js` ; `library-install.test.js` ; **`16` AAI-OFF-03-A/B/C** ; `ensureReleaseReady` auto-repair (`browser-offline-manager.js`) |
| **AAI-SHL-01** | PAS-SHELL | Le Shell **ne connaît jamais** le contenu pédagogique | **Couvert** | `shell-s1-chrome.test.js` (chrome statique sans blocs pédagogiques) ; `composition-engine.test.js` (`notes is published shell without blocks`) ; `17` CN-P-06 (shell notes sans contenu officiel) |
| **AAI-SHL-02** | PAS-SHELL | Composition **ne connaît jamais** le Shell | **Non couvert** | Aucun test d'import interdit (`composition/` n'importe pas `shell/` — vérifié manuellement). **Lacune :** absence de garde automatisée (lint ou test statique) |
| **AAI-SHL-03** | PAS-SHELL | Le **ReadingViewModel** est l'interface unique entre Composition et Renderer | **Partiel** | `composition-navigation.test.js` ; `compliance-nc.test.js` (`buildNavigationFromViewModel`) ; `composition-nominal-path.test.js` (`buildReadingViewModel` dans `app.js`) ; `17` CN-P-01 / `10` CN-01 (7 onglets depuis RVM) ; `14` DP-F-13 (RVM inchangé après prefs). **Lacune :** pas de fichier dédié `reading-view-model.test.js` |
| **AAI-MM-01** | PAS-MM | La vue est **entièrement alimentée** par le ReadingViewModel | **Couvert** | `composition-engine.test.js` (agrégation story + overview) ; `composition-navigation.test.js` ; `17` CN-P-02 |
| **AAI-AP-01** | PAS-AP | L'amorçage provient **uniquement** du package publié | **Couvert** | `15` AP-F-01…12 ; `cognitive-priming-renderer.test.js` ; `cognitive-priming-render.test.js` ; `compliance-nc.test.js` ; `tools/lou-build/test/cognitive-priming.test.js` |
| **AAI-NOT-01** | PAS-NOTIONS | La vue **ne dépend jamais** du chrome (Shell, prefs, breadcrumb) | **Partiel** | `14` DP-F-13 (RVM transverse inchangé) ; `display-preferences-d7-f-validation.test.js` DP-F-N17. **Lacune :** pas de test spécifique Notions isolé du chrome ; rendu nominal seulement (`17` CN-P-03) |
| **AAI-CLIN-01** | PAS-CLINICAL | Les cas proviennent **uniquement** du package | **Couvert** | `17` CN-P-04 (registre scénarios depuis manifest) ; `composition-engine.test.js` ; `composition-runtime-identity.test.js` |
| **AAI-COL-01** | PAS-COLLEGE | Le texte officiel **reste inchangé** (copie verbatim Fabrique → package → rendu) | **Partiel** | `college-source-publish.test.js` (copie verbatim à la publication) ; `college-official.test.js` (rendu FIL B verbatim) ; `12` OF-D2-05 (offline). **Lacune :** pas de hash d'intégrité bout-en-bout source éditoriale → package installé |
| **AAI-QCM-01** | PAS-QCM | Les QCM affichés proviennent **uniquement** du package | **Couvert** | `17` CN-P-05 ; `composition-engine.test.js` (`qcm lists published questions from manifest registry`) |
| **AAI-NTE-01** | PAS-NOTES | Les notes utilisateur **ne modifient jamais** le package publié | **Partiel** | `offline-manager.test.js` (`does not modify installed package tree during prepare`) ; `learner-patrimony-store.test.js` (scoping `release_id`, pas de fuite) ; `walkthrough-notes-restore.test.js` WT-INV-1 (flux officiel inchangé après restore). **Lacune :** pas de test explicite « annotation → package tree inchangé » |
| **AAI-LIB-01** | PAS-LIBRARY | Le Reader **ne dépend jamais** d'un chapitre codé en dur | **Partiel** | `renderer.test.js` (résolution générique `pneumo/999`) ; `shell-s2-breadcrumb.test.js` (pas de chapitre hardcodé). **Lacune :** outillage review/CI câblé sur 234 (`library-server.mjs`, `sync-reader-fixture.mjs`, `product-review-234.sh`) ; aucun Product Smoke Couche 1 |

**Lecture opérationnelle :** avant de prononcer une PAS **Couverture forte**, vérifier que tous ses AAI sont **Couvert** ou que les **Partiel** / **Non couvert** figurent en backlog [§6.3](#63-backlog-aai--invariants-non-couverts) avec priorité acceptée.

### 6.3 Backlog AAI — invariants non couverts

Backlog priorisée des AAI **Partiel** ou **Non couvert**. **Hors périmètre immédiat** — ne pas implémenter sans décision produit explicite.

| Priorité | ID | Invariant | Lacune | Validation recommandée *(future)* |
|---|---|---|---|---|
| ~~**P0**~~ | ~~AAI-OFF-01~~ | ~~SW n'empêche jamais la préparation~~ | **Clôturé PAS-OFFLINE 2** (2026-08-03) | — |
| ~~**P0**~~ | ~~AAI-OFF-03~~ | ~~Digest = vérité matérielle~~ | **Clôturé PAS-OFFLINE 2** (2026-08-03) | — |
| **P1** | AAI-SHL-02 | Composition ignore Shell | Aucune garde automatisée | Test statique ou lint : `composition/` ne doit pas importer `shell/` |
| **P1** | AAI-SHL-03 | ReadingViewModel = interface unique | Couverture indirecte dispersée | Unit test dédié `reading-view-model.test.js` : contrat RVM, un seul point d'entrée Renderer |
| **P1** | AAI-NOT-01 | Notions indépendante du chrome | DP-F-13 transverse, pas spécifique | Smoke ou unit : rendu Notions identique avec chrome modifié (breadcrumb masqué, prefs extrêmes) |
| **P2** | AAI-COL-01 | Texte officiel inchangé | Pas de hash intégrité source→package | Contract Test lou-build : hash source éditoriale = hash `source/official-college.md` publié |
| **P2** | AAI-NTE-01 | Notes n'altèrent pas le package | Scoping patrimoine OK ; immutabilité package non assertée | Contract Test : après création annotation, arbre `packages/<release_id>/` byte-identique |
| **P2** | AAI-LIB-01 | Pas de chapitre hardcodé | Code Reader générique ; outillage 234-only | Product Smoke Couche 1 (PAS-LIBRARY) + dé-hardcodage scripts review/fixture |

**Note méthodologique :** PAS-OFFLINE 2 (2026-08-03) a clôturé le backlog P0 (AAI-OFF-01, AAI-OFF-03). Validation manuelle Product Review sur profil navigateur persistant reste recommandée après merge.

### 6.4 Recommandations pour les prochaines PAS

| PAS / incrément | Action AAI recommandée |
|---|---|
| **PAS-OFFLINE** *(correctif prioritaire)* | **Clôturé PAS-OFFLINE 2** — valider Product Review visuelle profil persistant |
| **PAS-SHELL S2** | Livrer breadcrumb **et** AAI-SHL-02 (lint import) + renforcement AAI-SHL-03 lors de la clôture S2 |
| **PAS-AP** *(Phase 2 — prochaine)* | AAI-AP-01 déjà couvert ; prioriser contenu éditorial ; vérifier qu'aucun fallback dev ne contourne le package en mode produit |
| **PAS-LIBRARY** *(S3+)* | Créer le premier Product Smoke Couche 1 ; AAI-LIB-01 doit devenir **Couvert** avant prononcé PAS-LIBRARY |
| **PAS-NOTIONS / CLINICAL / COLLEGE** *(Phases 3–5)* | Enrichir les smokes existants (`17`, `12`) pour combler AAI-NOT-01 et AAI-COL-01 lors de l'ouverture éditoriale de chaque phase |
| **Maintenance framework** | Toute nouvelle PAS ou extension PAS → déclarer ses AAI dans [§6.2](#62-registre-aai--pas--invariants--validations) **avant** d'ajouter des tests ; ne jamais créer de smoke orphelin ([§12](#12-maintenance-et-évolution)) |

---

## 7. Inventaire des batteries

Audit consolidé — objectif, autorité et PAS couvertes.

| Batterie | Objectif | Niveau | Autorité | PAS / rôle |
|---|---|---|---|---|
| **Lou Build validate** | Package 234 conforme, installable | Fondation | Prérequis RELEASE | Toutes PAS |
| **Lou Build test:ci** | Pipeline Fabrique, contrats package | Contrats | RELEASE | PAS-OFFLINE |
| **Renderer npm test** | Composants isolés (651 tests) | Unit | DEV + fondation RELEASE | Toutes *(fondation)* |
| **Engineering Smokes** (`01`…`11`, `10`) | Non-régression mode dev | DEV | **Informatif** — ne prononce pas PAS | Protection moteur |
| **Product Smokes** (`12`…`17`) | Capacités produit `product=1` | PAS | **Autoritaire** pour PAS | Implémentent PAS §6 |
| **Product Review** | Acceptabilité humaine Lou | Humain | Suprême (Phase 7–8) | Au-delà PAS |
| **CI `ci-234.yml`** | Parité RELEASE sur `main` | RELEASE | Gate merge | Toutes PAS implémentées |
| **validate-dev.sh** | Feedback rapide développeur | DEV | Développement courant | — |
| **validate-reader-v1.sh** | Gate publication 234 | RELEASE | CI + pré-Review | Toutes PAS |
| **product-review-234.sh** | Observation produit publié | Humain | Product Freeze | Validation finale |

### 7.1 Engineering Smokes — détail

| Fichier | Objectif | PAS *(informatif)* |
|---|---|---|
| `01-creation` | Création surlignage | Couche apprenante |
| `02-persistence` | Persistance IndexedDB | Couche apprenante |
| `03-projections` | Projections legacy / walkthrough | PAS-MM *(dev)* |
| `04-lifecycle` | Cycle de vie annotations | Couche apprenante |
| `05-dom-integrity` | Intégrité DOM surlignage | Couche apprenante |
| `06-selection` | Sélection texte | Couche apprenante |
| `08-robustness` | Robustesse session longue | Couche apprenante |
| `09-svg-formatting` | Formatage SVG inline | Couche apprenante |
| `10-composition-navigation` | 7 vues mode dev | PAS-MM…NOTES *(dev)* |
| `11-offline-dev` | Dégradation Collège absent | PAS-COLLEGE *(dev)* |

### 7.2 Product Smokes — détail

| Fichier | Objectif | PAS |
|---|---|---|
| `12-offline-d2g` | Offline certification, 7 vues froid | PAS-OFFLINE, PAS-COLLEGE |
| `13-local-search-d6f` | Recherche locale transverse | Transverse |
| `14-display-preferences-d7f` | Préférences affichage | Transverse |
| `15-cognitive-priming-apf` | Amorçage cognitif complet | PAS-AP |
| `16-product-consumption` | Consommation produit, resync | PAS-OFFLINE |
| `17-product-composition-navigation` | 7 vues mode produit | PAS-MM, NOTIONS, CLINICAL, QCM, NOTES |

---

## 8. Ce qui n'est volontairement pas automatisé

| Élément | Raison | Niveau de validation |
|---|---|---|
| **Product Review visuelle / UX Lou** | Jugement d'usage réel | Product Review (Phase 7–8) |
| **Validation pédagogique Lou** | Métrique d'apprentissage | Future phase (§9) |
| **PAS-OFFLINE — AAI P0** | Invariants SW/digest partiellement couverts — incident Product Review 2026-08-03 | Backlog [§6.3](#63-backlog-aai--invariants-non-couverts) — correctif avant Review |
| **PAS-SHELL complète (S2–S5)** | Breadcrumb, Couche 1, routing non livrés | PAS-SHELL — S1 seulement |
| **PAS-LIBRARY** | Couche 1 non couverte en smoke produit | PAS-LIBRARY réservée |
| **Multi-chapitres bibliothèque** | Un seul chapitre complet (234) | Extension post-224 |
| **Contenu éditorial complet par vue** | Phases 3–5 non démarrées | PAS partielles + Product Review |
| **Sélection souris réelle (toolbar)** | Fragile en CI | Product Review si besoin |

---

## 9. Validation pédagogique — Future phase

**Statut :** emplacement réservé au sommet de la pyramide — **au-delà des PAS**.

Les PAS répondent à *« la fonctionnalité produit marche-t-elle ? »*. La validation pédagogique répondra à *« Lou apprend-elle mieux ? »* — conditionnée par Validation Corpus V1 et RPC 224 ([PDR-C8](../governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B4](../governance/PRODUCT-DECISION-REGISTRY.md)).

Aucune PAS pédagogique n'est créée en T0.

---

## 10. Prononcé des jalons

### 10.1 Jalon technique

**Question :** *les fondations et les PAS implémentées sont-elles vertes ?*

1. Lou Build Validation PASS
2. Unit + Contract Tests PASS
3. Toutes les **PAS exigées pour le lot** vertes via Product Smokes
4. Tous les **AAI associés** à ces PAS au statut **Couvert** — ou backlog P0/P1 explicitement accepté ([§6.2](#62-registre-aai--pas--invariants--validations), [§6.3](#63-backlog-aai--invariants-non-couverts))

### 10.2 Publication

**Question :** *le package publié est-il consommable ?*

1. Jalon technique (§10.1)
2. `lou-build build` PASS
3. **PAS-OFFLINE** verte sur le digest publié

### 10.3 Product Review

**Question :** *Lou accepte-t-il le produit ?*

1. Publication (§9.2)
2. Gate automatisé complet (`validate-reader-v1.sh`) vert
3. **PAS concernées** vertes pour la phase visée
4. Product Review manuelle via [`product-review-234.sh`](../../scripts/product-review-234.sh) — observation OK

**Autorité :** suprême pour Product Freeze (Phase 8).

### 10.4 Clôture d'une phase produit

**Règle :** une phase RPC se considère **techniquement clôturée** lorsque sa PAS associée (§5) est **verte** sur le package 234 en mode produit. La clôture **éditoriale** complète inclut Product Review quand la phase le requiert (Phase 7+).

---

## 11. Orchestration — quoi lancer, quand, pourquoi

| Besoin | Niveau | Commande |
|---|---|---|
| Je modifie le Reader | **DEV** | `./scripts/validate-dev.sh` |
| Je clôture une PAS (ex. PAS-SHELL S2) | **PAS** | Gate ciblé §6 + Product Review si requis |
| Je merge sur `main` / publie | **RELEASE** | `./scripts/validate-reader-v1.sh` ou `./scripts/ci-234.sh` |
| Lou valide le produit | **Humain** | `./scripts/product-review-234.sh` *(après RELEASE vert)* |

| Script | Niveau | Rôle |
|---|---|---|
| [`scripts/validate-dev.sh`](../../scripts/validate-dev.sh) | DEV | Unit + Engineering Smokes — feedback rapide |
| [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh) | RELEASE | Gate complet — fondations + toutes PAS |
| [`scripts/ci-234.sh`](../../scripts/ci-234.sh) | RELEASE | Parité locale avec CI GitHub |
| [`scripts/product-review-234.sh`](../../scripts/product-review-234.sh) | Humain | Observation produit publié |

```bash
# Développement courant
./scripts/validate-dev.sh

# Gate publication (CI, merge main)
./scripts/validate-reader-v1.sh

# Validation humaine finale
./scripts/product-review-234.sh
```

**Rapport RELEASE :** le script `validate-reader-v1.sh` conclut par un résumé **PAS** — pas par un compteur de fichiers.

---

## 12. Maintenance et évolution

1. **Nouvelle fonctionnalité produit** → définir ou étendre une **PAS** ; déclarer ses **AAI** ([§6.2](#62-registre-aai--pas--invariants--validations)) ; identifier les Product Smokes qui les implémentent.
2. **Nouveau Product Smoke** → rattacher à une PAS existante — ne pas créer de smoke orphelin ; couvrir au moins un AAI ou critère d'acceptation explicite.
3. **Nouveau test unit/contrat/engineering** → classer comme fondation ou non-régression d'une PAS **et** rattacher à un AAI si applicable.
4. **Clôture phase roadmap** → PAS verte + AAI couverts + Product Review si applicable.
5. **Ne pas figer de compteurs** — piloter par PAS, AAI et statuts (§3.2, §3.4, §6).
6. **Framework stable** — les prochaines PAS (SHELL S2, MM, AP…) s'appuient sur ce cadre **sans refonte** de la stratégie ni nouvelle famille de tests.

---

## 13. Historique

| Version | Apport |
|---|---|
| **T0 initial** | Pyramide, séparation Product/Engineering, Product Smokes autoritaires |
| **T0 consolidé** | Pilotage produit, critères de jalons simplifiés |
| **T0 + PAS** | Product Acceptance Suites = unité de progression roadmap |
| **Framework consolidé** | Niveaux DEV/PAS/RELEASE ; cartographie §6 ; inventaire batteries §7 ; gate DEV ; framework **stable** |
| **Framework + AAI** | Architectural Acceptance Invariants = première couche PAS ; registre §6.2 ; backlog §6.3 ; PAS = registre officiel des invariants d'architecture |

Commits : `e4f733c`, `69310e8`, `ac98720`, consolidation 2026-08-03.

---

*Architecture de validation Reader V1 — pilotage par Product Acceptance Suites. Non normatif technique ; autoritaire sur la hiérarchie des validations et la progression roadmap.*
