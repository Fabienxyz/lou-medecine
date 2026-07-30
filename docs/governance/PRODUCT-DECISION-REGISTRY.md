# Registre de décisions produit — Audit système 2026-07-30

| | |
|---|---|
| **Type** | Registre de gouvernance — **informatif** |
| **Statut** | Décisions actées — 2026-07-30 |
| **Contexte** | Audit système complet + clarifications produit Q1–Q24′ |
| **Autorité** | Aucune — ne remplace ni ADR, ni contrats, ni docs 14–19 |
| **Documents normatifs issus** | [`ADR-006`](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) ; amendements contrats et specs |
| **Registres connexes** | [`COMPOSITION-DECISION-REGISTRY.md`](COMPOSITION-DECISION-REGISTRY.md) (couche Composition, 2026-07-28) · [`DOCUMENT_ARCHITECTURE.md`](DOCUMENT_ARCHITECTURE.md) (doctrine pilotage, 2026-07-30) |

Ce registre consolide l'ensemble des arbitrages produit issus de l'audit système et des réponses Q1–Q24′. Il constitue la **mémoire des décisions** — pas une source normative.

**Point d'entrée de la propagation documentaire.** Ce registre sert de **base de travail** pour la propagation des décisions acceptées vers les documents normatifs du projet (ADR, contrats, specs, roadmap, état courant). L'organisation du pilotage documentaire est définie dans [`DOCUMENT_ARCHITECTURE.md`](DOCUMENT_ARCHITECTURE.md). Une décision **acceptée** n'est réellement intégrée au projet que lorsqu'elle est **propagée** dans les documents concernés. Le suivi de cette propagation est consolidé en annexe C ; l'audit de cohérence ultérieur s'appuiera sur [`PRODUCT-DECISION-PROPAGATION-AUDIT.md`](PRODUCT-DECISION-PROPAGATION-AUDIT.md) *(à produire)*.

**Règle de lecture :** pour savoir ce qui doit être vrai → contrats, ADR, docs 14–19 ; pour savoir **pourquoi** → ce registre.

---

## Domaine A — Régime de vérité et contenu publié

### PDR-A1 — Régime de vérité unique

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q1 |
| **Décision retenue** | Le système ne distingue pas un « régime de vérité IA » d'un « régime de vérité officiel ». Le Collège officiel demeure l'unique source normative. Tous les contenus publiés sont des transformations pédagogiques fidèles du Collège, quel que soit leur mode de production. |
| **Justification** | Une seule chaîne de vérité évite une seconde autorité pédagogique. Le Reader est consommateur pur ; toute production appartient à La Fabrique. |
| **Décisions rejetées** | Régime allégé pour contenu IA ; génération dynamique de contenu pédagogique côté Reader ; badge « IA » comme indicateur de confiance. |
| **Documents cibles** | `01-TRUST-AND-FIDELITY.md` ; `16-CONTENT-TO-READER-ARCHITECTURE.md` §4 |
| **ADR associé** | — |
| **Critère de propagation** | Aucun contenu pédagogique publié hors Chapter Package ; Reader documenté comme consommateur exclusif. |

---

### PDR-A2 — Familles de contenu et badges épistémiques

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q1c |
| **Décision retenue** | Deux catégories de contenu, portées par la Composition Specification (niveau onglet) : **📘 Collège officiel** (Amorçage, Modèle mental, Notions, Collège officiel) et **✨ Construit à partir du Collège** (Cas cliniques, QCM). L'onglet Notes ne porte aucun badge. Pas de badge « IA ». |
| **Justification** | Le statut utile pour Lou est la relation au Collège, pas le mode de production. |
| **Décisions rejetées** | Badge « IA » décrivant le mode de production. |
| **Documents cibles** | `COMPOSITION-COMPONENT-CONTRACT.md` ; `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | — |
| **Critère de propagation** | Badges définis au niveau Composition, absents du Chapter Package publié. |

---

### PDR-A3 — Corpus d'évaluation au niveau chapitre

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q1a, Q1b |
| **Décision retenue** | Le corpus QCM et cas cliniques est défini au niveau du **Chapter Package complet**. Cible : 3–5 cas cliniques complémentaires (standard, piège, synthèse, + éventuels selon intérêt pédagogique) ; ~30 / ~50 / ~70 QCM selon densité du chapitre (objectifs, non contraintes strictes). Génération au build, grounding, publication dans le package ; consommation Reader sans génération dynamique. |
| **Justification** | Vérifier la compréhension globale du chapitre, pas constituer une banque EDN exhaustive. |
| **Décisions rejetées** | Corpus d'évaluation au niveau tranche ; banque infinie de QCM régénérés à chaque lecture. |
| **Documents cibles** | `04-CHAPTER-PACKAGE.md` ; `17-PUBLICATION-MODEL.md` |
| **ADR associé** | — |
| **Critère de propagation** | Artefacts QCM/cas déclarés dans le modèle de publication ; Reader consomme sans génération. |

---

### PDR-A4 — Texte Collège publié dans le package

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q6, Q6a |
| **Décision retenue** | Le texte officiel du Collège fait partie intégrante du Chapter Package et alimente l'onglet « Collège officiel ». L'accès à cet onglet est piloté par une **politique d'affichage Reader** (Composition), indépendante du contenu du package. Pour Lou V1 : onglet **visible par défaut**. |
| **Justification** | Traçabilité claim ↔ source et lecture cohérente, sans fetch externe. La visibilité reste une décision Reader. |
| **Décisions rejetées** | Package sans texte source ; variante « package allégé » pour contraintes juridiques (reportées hors conception à ce stade). |
| **Documents cibles** | `04-CHAPTER-PACKAGE.md` ; `COMPOSITION-COMPONENT-CONTRACT.md` |
| **ADR associé** | ADR-006 §2 |
| **Critère de propagation** | Gate de présence texte source pour chapitre complet ; visibilité onglet documentée côté Composition. |

---

## Domaine B — Jalon produit et golden master

### PDR-B1 — Critère d'acceptation Reader V1

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Jalon Reader, Q1a, conclusion pré-Q2 |
| **Décision retenue** | Le critère d'acceptation du Reader V1 est la prise en charge complète d'un **premier Chapter Package complet**, non d'une tranche pédagogique. Le contrat fonctionnel du Reader est défini au niveau du package publié. |
| **Justification** | QCM, cas cliniques et expérience globale n'ont de sens qu'à l'échelle chapitre. |
| **Décisions rejetées** | Reader V1 validé sur `cardio/234` en mode tranche. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` ; `MASTER_ROADMAP.md` |
| **ADR associé** | — |
| **Critère de propagation** | Jalon Reader explicitement = package complet. |

---

### PDR-B2 — Golden master Item 234 — édition 2023

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q3e, Q24′ |
| **Décision retenue** | Golden master = **Item 234 — Insuffisance cardiaque, édition Collège 2023**. Rôles : premier package complet ; validation pédagogique Lou ; acceptance Reader V1 ; référence de non-régression Fabrique. |
| **Justification** | Chapitre le plus avancé ; référentiel éditorial stable pendant la validation. |
| **Décisions rejetées** | Changer de référentiel éditorial pendant la validation du premier package. |
| **Différé à** | Alignement acquisition : qualification/import édition 2023 (dépôt actuellement en 2022). |
| **Documents cibles** | `MASTER_ROADMAP.md` ; `17-PUBLICATION-MODEL.md` |
| **ADR associé** | ADR-006 §4 |
| **Critère de propagation** | Golden master identifié avec `(item, édition, version)` ; tests non-régression référencés. |

---

### PDR-B3 — Tranche 234 = POC historique

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q5 |
| **Décision retenue** | La tranche verticale actuelle de l'Item 234 a rempli son rôle (contrats, pipeline, prototype Reader). La prochaine priorité est de faire évoluer l'Item 234 vers un Chapter Package **complet** (réconciliation exhaustive, inventory, blueprint, projections, QCM/cas, gates satisfaits). |
| **Justification** | Valider la chaîne complète produire → publier → consommer. |
| **Décisions rejetées** | Étendre la tranche OAP comme jalon produit ; abandonner le travail existant sur 234. |
| **Documents cibles** | `MASTER_ROADMAP.md` ; `18-BUILD-ARCHITECTURE.md` |
| **ADR associé** | — |
| **Critère de propagation** | Priorité roadmap = complétion 234 entier, pas tranche. |

---

### PDR-B4 — Validation Lou = méthode, pas chaque chapitre

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q3b |
| **Décision retenue** | Lou valide le **premier** Chapter Package complet pour confirmer la méthode pédagogique. Ce jalon n'est pas une étape permanente du pipeline. La production courante des chapitres suivants repose sur les gates automatiques. |
| **Justification** | À l'échelle ~360 items, la relecture humaine systématique n'est pas viable. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` ; `MASTER_ROADMAP.md` |
| **ADR associé** | — |
| **Critère de propagation** | Distinction explicite jalon validation Lou vs pipeline gates. |

---

### PDR-B5 — Architecture 7 vues gelée ; contenu progressif en dev seulement

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q4 |
| **Décision retenue** | Le Reader V1 conserve **7 vues** comme architecture définitive. Pendant le développement, certaines vues peuvent être vides ou « non disponibles ». À l'**acceptation** Reader V1 : les 7 vues sont **alimentées** par le package golden master. Pas de « V1 à N vues » comme produit intermédiaire. |
| **Justification** | Une seule architecture Reader ; la Composition porte les états de disponibilité. |
| **Décisions rejetées** | Reader V1 fonctionnellement réduit (3 ou 5 vues). |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` ; `COMPOSITION-COMPONENT-CONTRACT.md` |
| **ADR associé** | — |
| **Critère de propagation** | 7 vues dans Composition ; critère d'acceptation = 7 vues alimentées. |

---

## Domaine C — La Fabrique et industrialisation

### PDR-C1 — Cible = usine autonome ; Cursor = capitalisation

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q3, Q3d |
| **Décision retenue** | Le workflow Cursor/prompts manuels est une phase de **capitalisation**, pas la cible. La cible est une chaîne Lou Build largement autonome produisant tous les artefacts à partir du Collège. L'humain pilote l'usine, pas chaque chapitre. Le livrable structurant du projet est **La Fabrique**, pas une collection artisanale de packages. |
| **Justification** | La couverture EDN exige une chaîne reproductible, pas une production artisanale. |
| **Décisions rejetées** | Workflow Cursor permanent comme mode de production courante. |
| **Documents cibles** | `18-BUILD-ARCHITECTURE.md` ; `MASTER_ROADMAP.md` |
| **ADR associé** | ADR-006 §5 |
| **Critère de propagation** | Stratégie capitalisation → runtime documentée. |

---

### PDR-C2 — Ordre : golden master capitalisé, puis automatisation

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q3d, Q3c |
| **Décision retenue** | **1.** Produire le premier Chapter Package complet de référence (capitalisation + gates). **2.** Valider méthode, modèle de publication, Reader V1, UX Lou. **3.** Automatiser progressivement la reproduction (réconciliation → inventory → blueprint → projections → grounding sémantique). Fabrique et Reader avancent **en parallèle** ; l'acceptation Reader exige le package complet réel. |
| **Justification** | Le package complet de référence doit précéder l'industrialisation pour éviter les angles morts fonctionnels. |
| **Décisions rejetées** | Conditionner le golden master à l'autonomie complète de Lou Build. |
| **Documents cibles** | `MASTER_ROADMAP.md` ; `19-BUILD-PIPELINE.md` |
| **ADR associé** | — |
| **Critère de propagation** | Séquence capitalisation puis industrialisation explicite dans la roadmap. |

---

### PDR-C3 — Intervention humaine en production

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q3a |
| **Décision retenue** | Production courante = gates automatiques. Publication sans intervention humaine si tous les gates passent. Intervention humaine réservée à : évolution méthode/contrats ; échec de gate ; audit qualité ponctuel volontaire (hors pipeline). |
| **Justification** | Industrialiser les contrôles, pas la relecture permanente. |
| **Différé à** | Élimination des allowlists de grounding manuelles. |
| **Documents cibles** | `19-BUILD-PIPELINE.md` |
| **ADR associé** | — |
| **Critère de propagation** | Règles d'intervention humaine documentées dans le pipeline. |

---

### PDR-C4 — Ambition ~360 items EDN

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q2 |
| **Décision retenue** | Couvrir l'intégralité du programme EDN (~360 items) sur un horizon pluriannuel. Cardiologie = pilote pour stabiliser la méthode. Industrialiser contrôles, traçabilité, reproductibilité et pipeline — pas le travail humain proportionnel. |
| **Justification** | L'effort ne doit pas croître linéairement avec le nombre de chapitres. |
| **Documents cibles** | `MASTER_ROADMAP.md` ; `LLM_STRATEGY.md` |
| **ADR associé** | — |
| **Critère de propagation** | Ambition et horizon explicites dans la roadmap. |

---

### PDR-C5 — Budget LLM : R&D vs production

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q12 |
| **Décision retenue** | R&D : abonnements fixes (Cursor, ChatGPT Plus) — coût non prioritaire à optimiser. Production EDN : coût marginal faible ; modèles premium uniquement si valeur démontrable ; architecture découplée du fournisseur/modèle LLM. Pas de budget chiffré par chapitre à ce stade. |
| **Justification** | Viabilité économique à l'échelle sans dépendance structurelle au premium à l'usage. |
| **Différé à** | Budget chiffré après golden master et premiers chapitres automatisés. |
| **Documents cibles** | `LLM_STRATEGY.md` ; `18-BUILD-ARCHITECTURE.md` |
| **ADR associé** | — |
| **Critère de propagation** | Contrainte viabilité production et découplage modèle/pipeline documentés. |

---

### PDR-C6 — Interface Admin = client Lou Build

| | |
|---|---|
| **Statut** | Acceptée — implémentation différée |
| **Source audit** | Q7 |
| **Décision retenue** | L'utilisateur « non-développeur » est le **mainteneur** (pas Lou). Interface Admin légère, client des interfaces officielles Lou Build, sans logique métier nouvelle. Périmètre : import Collège, lancement fabrication, suivi stages, rapports d'erreur, publication/récupération package, archivage/restauration. Publication atomique ; archivage par défaut (pas suppression) ; journal d'audit des opérations ; protections anti-écrasement. |
| **Justification** | Exploitabilité durable sans mémoire des commandes ; Lou ne touche pas à La Fabrique. |
| **Différé à** | Post-golden master, avant montée en charge chapitres cardio suivants. |
| **Documents cibles** | Contrat composant `ADMIN-OPERATIONS-CONTRACT.md` *(à créer)* ; `18-BUILD-ARCHITECTURE.md` |
| **ADR associé** | ADR-006 §5 |
| **Critère de propagation** | Admin documenté comme client Lou Build ; CLI reste interface de secours/CI. |

---

### PDR-C7 — Premier diff éditorial 2023 → 2026

| | |
|---|---|
| **Statut** | Acceptée — après golden master |
| **Source audit** | Q24, Q24′ |
| **Décision retenue** | Après validation du golden master 2023 : premier diff industrialisé = **édition 2023 → édition 2026** pour l'Item 234. La Fabrique produit un artefact de comparaison fiable ; le Reader le consomme (UI simple, pas comparaison avancée initialement). |
| **Justification** | Premier cas concret de mise à jour éditoriale ; modèle pour les évolutions Collège futures. |
| **Documents cibles** | `04-CHAPTER-PACKAGE.md` ; `17-PUBLICATION-MODEL.md` |
| **ADR associé** | ADR-006 §4 |
| **Critère de propagation** | Obligation artefact diff ; premier cas 2023→2026 identifié. |

---

## Domaine D — Reader et expérience Lou

### PDR-D1 — App installable et bibliothèque locale

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q8 |
| **Décision retenue** | Cible produit = Reader **local installable**, autonome, indépendant du dépôt Git, sans commandes de développement. Bibliothèque de Chapter Packages séparée de l'arborescence projet. Pas de serveur comme prérequis Reader. Mode dev localhost ≠ cible produit. |
| **Justification** | Usage personnel durable : Lou ouvre sa bibliothèque et étudie. |
| **Documents cibles** | `14-LOU-READER-ARCHITECTURE.md` ; contrat composant `LIBRARY-CATALOG-CONTRACT.md` *(à créer)* |
| **ADR associé** | ADR-006 §6 |
| **Critère de propagation** | Architecture installable documentée ; chemins dépôt supprimés comme prérequis produit. |

---

### PDR-D2 — Mode hors ligne intégral

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q11 |
| **Décision retenue** | Reader 100 % offline pour tous les packages **déjà installés** : texte, projections, figures, annotations, progression. La Fabrique peut nécessiter le réseau (LLM). Technologie ouverte (Tauri, PWA, etc.). |
| **Justification** | Compagnon d'apprentissage utilisable sans connexion. |
| **Documents cibles** | `14-LOU-READER-ARCHITECTURE.md` ; `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | ADR-006 §6 |
| **Critère de propagation** | Offline sur packages installés = exigence Reader documentée. |

---

### PDR-D3 — Sync-ready multi-appareils

| | |
|---|---|
| **Statut** | Acceptée (architecture) — sync auto **différée** |
| **Source audit** | Q9 |
| **Décision retenue** | Reader utilisable sur iPhone, iPad, MacBook Air. Architecture **sync-ready** dès l'origine (identifiants, schémas). Sync complète des données utilisateur **post-V1**. Export/import comme pont V1. Extensibilité Windows/Android préservée dans le choix technologique. |
| **Justification** | Lou alterne appareils ; l'architecture ne doit pas imposer de refonte ultérieure. |
| **Différé à** | Implémentation sync automatique (post-V1). |
| **Documents cibles** | `02-IDENTITY-AND-ANCHORS.md` ; `06-RENDERER-AND-LEARNER-LAYER.md` |
| **ADR associé** | ADR-006 §3 |
| **Critère de propagation** | Identifiants stables ; clés incluant version package ; pont sauvegarde/restauration documenté. |

---

### PDR-D4 — Reprise de session Reader V1

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q15, Q15a, Q15b |
| **Décision retenue** | Reprise de session **obligatoire avant validation Lou**. V1 restaure : dernier package consulté, dernier onglet actif, dernier point de reprise dans le contenu. État UI éphémère non conservé. Reprise par défaut (pas retour systématique à l'Amorçage). |
| **Justification** | Étude sur plusieurs semaines ; validation en conditions d'usage réelles. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` ; `06-RENDERER-AND-LEARNER-LAYER.md` |
| **ADR associé** | ADR-006 §3 |
| **Critère de propagation** | Reprise session V1 explicite dans la spec fonctionnelle. |

---

### PDR-D5 — Progression pédagogique = raffinement post-V1

| | |
|---|---|
| **Statut** | Acceptée — UX différée |
| **Source audit** | Q15b |
| **Décision retenue** | La métrique de « progression » (%, blocs, objectifs) n'est pas figée en V1. Le mécanisme de reprise de session est le socle ; l'indicateur visuel pourra évoluer après retours Lou. Les marqueurs de progression, une fois introduits, relèvent du patrimoine utilisateur protégé. |
| **Justification** | Prioriser la continuité de travail sur le design d'un indicateur prématuré. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | ADR-006 §3 |
| **Critère de propagation** | Distinction reprise V1 vs indicateur progression post-V1. |

---

### PDR-D6 — Recherche textuelle locale V1

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q17 |
| **Décision retenue** | Reader V1 : recherche limitée au **Chapter Package ouvert**. Recherche globale bibliothèque = évolution future. |
| **Justification** | Utile en révision ; la recherche globale attend une bibliothèque multi-chapitres. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | — |
| **Critère de propagation** | Recherche locale V1 ; globale différée. |

---

### PDR-D7 — Préférences d'affichage V1

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q19 |
| **Décision retenue** | V1 : thème clair/sombre, taille police, largeur de lecture — persistées et restaurées. Données utilisateur locales, sans impact contenu pédagogique. |
| **Justification** | Confort d'usage en conditions réelles de validation. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | — |
| **Critère de propagation** | Préférences listées et persistance documentées. |

---

### PDR-D8 — Statistiques d'usage sans score de compréhension

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q20 |
| **Décision retenue** | Conserver des stats factuelles (temps lecture, chapitres/dates consultés). Pas de score global de compréhension ou indicateur synthétique de maîtrise. |
| **Justification** | La compréhension ne se réduit pas à une métrique unique. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | — |
| **Critère de propagation** | Stats autorisées vs score interdit documentés. |

---

### PDR-D9 — Barème QCM EDN V1, architecture évolutive

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q21 |
| **Décision retenue** | V1 : barème officiel EDN (1 / 0,5 / 0,2 / 0). Architecture permettant évolution ultérieure (réponse partiellement correcte, etc.) sans refonte moteur QCM. |
| **Justification** | Entraînement proche des conditions EDN ; barème évolutif. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` ; `04-CHAPTER-PACKAGE.md` |
| **ADR associé** | — |
| **Critère de propagation** | Barème V1 EDN ; extensibilité moteur documentée. |

---

### PDR-D10 — Pas d'export PDF V1

| | |
|---|---|
| **Statut** | Acceptée — différée |
| **Source audit** | Q18 |
| **Décision retenue** | Impression / export PDF hors périmètre Reader V1. |
| **Justification** | Expérience interactive prioritaire. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | — |
| **Critère de propagation** | PDF explicitement hors V1. |

---

## Domaine E — Patrimoine et données

### PDR-E1 — Zéro perte acceptable

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q10 |
| **Décision retenue** | Toute perte de données est inacceptable — packages publiés et données utilisateur. Aucune migration ne supprime silencieusement ; sauvegarde et restauration sans perte obligatoires ; opérations destructives précédées de sauvegarde ou retour arrière. |
| **Justification** | Un package régénéré n'est pas identique ; le travail apprenant est non reproductible. |
| **Documents cibles** | `06-RENDERER-AND-LEARNER-LAYER.md` ; [`ADR-006`](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) |
| **ADR associé** | ADR-006 §1, §7 |
| **Critère de propagation** | Principe zéro perte dans contrats persistance et publication. |

---

### PDR-E2 — Trois patrimoines distincts

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q10 |
| **Décision retenue** | **Sources de production** (reconstruisibles) ; **Chapter Packages publiés** (référence d'étude) ; **données d'apprentissage** (non reproductibles). Chaque catégorie protégée selon ses règles. |
| **Justification** | Cycles de vie distincts ; complète ADR-003 (SSOT sources en entrée). |
| **Documents cibles** | `17-PUBLICATION-MODEL.md` ; [`ADR-006`](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) |
| **ADR associé** | ADR-006 §1 |
| **Critère de propagation** | Trois patrimoines nommés et gouvernés. |

---

### PDR-E3 — Identité propre des packages publiés

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q10, Q7 |
| **Décision retenue** | Un package publié validé = patrimoine conservé. Régénération Fabrique = **nouvel objet**, même si médicalement équivalent. Publication atomique ; jamais remplacer un package actif par un build incomplet ou échoué. Archivage, pas suppression par défaut. |
| **Justification** | Traçabilité du travail apprenant et comparaison éditoriale. |
| **Documents cibles** | `04-CHAPTER-PACKAGE.md` ; `17-PUBLICATION-MODEL.md` |
| **ADR associé** | ADR-006 §2, §5 |
| **Critère de propagation** | Identité versionnée ; bascule atomique ; conservation versions antérieures. |

---

### PDR-E4 — Ancrage données à une version de package

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q10, addendum Q10 |
| **Décision retenue** | Toute donnée apprenante référence `(chapter, edition, publication_version)` ou empreinte équivalente. Changement d'édition = nouveau package ; données restent sur version étudiée. Orphelins signalés, jamais supprimés silencieusement. |
| **Justification** | La clé chapitre seule est insuffisante dès qu'une édition ou republication modifie le contenu. |
| **Documents cibles** | `02-IDENTITY-AND-ANCHORS.md` ; `06-RENDERER-AND-LEARNER-LAYER.md` |
| **ADR associé** | ADR-006 §3 ; complète ADR-005 |
| **Critère de propagation** | Clé de persistance inclut version package. |

---

### PDR-E5 — Sauvegarde et restauration des données

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q10, Q9 |
| **Décision retenue** | Les données d'apprentissage doivent pouvoir être **sauvegardées et restaurées sans perte**. Sert de filet de sécurité et pont V1 vers sync multi-appareils. |
| **Justification** | Un stockage runtime seul ne garantit pas la préservation du travail apprenant. |
| **Documents cibles** | `06-RENDERER-AND-LEARNER-LAYER.md` ; `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | ADR-006 §6 |
| **Critère de propagation** | Sauvegarde/restauration documentée comme exigence V1. |

---

### PDR-E6 — Données d'apprentissage protégées

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Addendum Q10 |
| **Décision retenue** | Patrimoine utilisateur inclut : annotations, notes, surlignages, historique QCM (réponses, tentatives, états visuels), marqueurs de progression, reprise de session, préférences. Préservées lors des migrations et restaurations ; modèle compatible sync future. |
| **Justification** | Non reproductible depuis les sources ; même protection que les packages publiés. |
| **Documents cibles** | `06-RENDERER-AND-LEARNER-LAYER.md` |
| **ADR associé** | ADR-006 §3 |
| **Critère de propagation** | Schéma persistance QCM et données apprenantes dès V1. |

---

## Domaine F — Visuels

### PDR-F1 — Corpus SVG legacy = archive R&D

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q13 |
| **Décision retenue** | Pas de migration du corpus legacy (`generated-assets/`, etc.) vers la nouvelle architecture. Conservé en archive ; non utilisé pour nouveaux packages ; remplacement progressif par visuels régénérés conformes à la grammaire. |
| **Justification** | Legacy non reproductible ; incompatible avec la production à l'échelle. |
| **Documents cibles** | `05-VISUAL-GRAMMAR.md` ; `19-BUILD-PIPELINE.md` |
| **ADR associé** | ADR-001 |
| **Critère de propagation** | Interdiction SVG legacy dans packages publiés neufs. |

---

### PDR-F2 — Primitives visuelles incrémentales

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q14 |
| **Décision retenue** | V1 n'implémente pas les 10 primitives du catalogue. Critère = couverture pédagogique du golden master, pas nombre de moteurs. Catalogue 10 = cible architecture ; ordre d'implémentation piloté par besoins Item 234. |
| **Justification** | ADR-001 gèle la spec ; l'implémentation suit les besoins pédagogiques réels. |
| **Documents cibles** | `05-VISUAL-GRAMMAR.md` |
| **ADR associé** | ADR-001 |
| **Critère de propagation** | Sous-ensemble primitives justifié par 234 documenté. |

---

### PDR-F3 — Visuels secondaires différables si explicites

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q14a |
| **Décision retenue** | Golden master pédagogiquement complet sans exiger un SVG par `visual_intent`. Visuels **indispensables** publiés ; secondaires différables via `planned-not-built` / équivalent explicite. Absence non documentée = défaut de production ; absence documentée = dette assumée. |
| **Justification** | Lou valide la compréhension ; une absence explicite est une dette, pas un oubli. |
| **Documents cibles** | `04-CHAPTER-PACKAGE.md` ; `05-VISUAL-GRAMMAR.md` |
| **ADR associé** | — |
| **Critère de propagation** | États visuels explicites dans manifest ; gate refuse absence silencieuse. |

---

### PDR-F4 — Fin de svg.js / process-flow pour nouveaux packages

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q14a |
| **Décision retenue** | Nouveaux Chapter Packages s'appuient sur le moteur grammaire visuelle officiel. Chemins hérités (`svg.js`, `process-flow`) conservés en transition puis retirés ; non utilisés pour production neuve. |
| **Justification** | Cohérent avec l'abandon du legacy visuel. |
| **Documents cibles** | `19-BUILD-PIPELINE.md` |
| **ADR associé** | ADR-001 |
| **Critère de propagation** | Stage G documenté comme cible moteur grammaire. |

---

## Domaine G — Évolutions futures et maintenance

### PDR-G1 — Répétition espacée

| | |
|---|---|
| **Statut** | Différée |
| **Source audit** | Q22 |
| **Décision retenue** | Hors Reader V1. Évolution naturelle post-V1 via Knowledge Points. Architecture compatible sans l'exiger en V1. |
| **Justification** | Priorité = comprendre les mécanismes avant mémoriser. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | — |
| **Critère de propagation** | Hors V1 documenté ; KP-ready sans scheduler V1. |

---

### PDR-G2 — Multi-utilisateurs

| | |
|---|---|
| **Statut** | Rejetée (hors périmètre V1 et projet actuel) |
| **Source audit** | Q23 |
| **Décision retenue** | Projet exclusivement destiné à Lou. Pas d'ouverture autres étudiants, commercialisation ou plateforme multi-utilisateurs. Extension future = décision d'architecture spécifique (auth, hébergement, droits). |
| **Justification** | Optimisation usage personnel. |
| **Documents cibles** | `14-LOU-READER-ARCHITECTURE.md` ; `MASTER_ROADMAP.md` |
| **ADR associé** | — |
| **Critère de propagation** | Lou-only explicite ; pas de auth multi-tenant V1. |

---

### PDR-G3 — Lignée éditoriale et comparaison d'éditions

| | |
|---|---|
| **Statut** | Acceptée (architecture) — UI simple court terme |
| **Source audit** | Q24 |
| **Décision retenue** | Comparaison entre éditions successives = fonctionnalité importante. Architecture anticipée : conservation multi-éditions, artefact diff Fabrique, consommation Reader. Pas de comparaison avancée en premier temps. |
| **Justification** | Anticiper la lignée éditoriale évite une refonte coûteuse lors des mises à jour du Collège. |
| **Documents cibles** | `17-PUBLICATION-MODEL.md` ; [`ADR-006`](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) |
| **ADR associé** | ADR-006 §4 |
| **Critère de propagation** | Lignée éditoriale et artefact diff dans modèle publication. |

---

### PDR-G4 — Recherche globale bibliothèque

| | |
|---|---|
| **Statut** | Différée |
| **Source audit** | Q17 |
| **Décision retenue** | Recherche à l'échelle de tous les packages installés = post-V1, quand bibliothèque multi-chapitres disponible. |
| **Justification** | Recherche locale suffit pour V1 et golden master unique. |
| **Documents cibles** | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| **ADR associé** | — |
| **Critère de propagation** | Globale listée comme évolution future. |

---

### PDR-G5 — Sync automatique multi-appareils

| | |
|---|---|
| **Statut** | Différée (architecture sync-ready **Acceptée** — voir PDR-D3) |
| **Source audit** | Q9 |
| **Décision retenue** | Implémentation sync auto progressive, post-V1. Sauvegarde/restauration = pont. Packages installés identiques sur appareils (copie manuelle ou Admin en interim). |
| **Justification** | Sync-ready sans bloquer le jalon Reader. |
| **Documents cibles** | `14-LOU-READER-ARCHITECTURE.md` ; `06-RENDERER-AND-LEARNER-LAYER.md` |
| **ADR associé** | ADR-006 §3 |
| **Critère de propagation** | Sync auto différée ; sync-ready et pont documentés. |

---

### PDR-G6 — Maintenabilité par contrats, tests et CI

| | |
|---|---|
| **Statut** | Acceptée |
| **Source audit** | Q16 |
| **Décision retenue** | Maintenabilité assurée par architecture documentée (décisions, contrats, invariants), suite de tests non-régression, **CI** vérifiant pipeline et packages — pas par la mémoire de l'auteur. Documentation normative ciblée, pas exhaustive. Golden master 234 = fixture de non-régression. |
| **Justification** | Reprise possible après une longue interruption ; le projet ne repose pas sur une seule mémoire. |
| **Documents cibles** | `MASTER_ROADMAP.md` ; `PROJECT_STATE.md` |
| **ADR associé** | — |
| **Critère de propagation** | CI et tests golden master dans roadmap. |

---

## Annexe A — Correspondance Q1–Q24′ → PDR

| Question audit | Entrée registre |
|---|---|
| Q1 | PDR-A1 |
| Q1a | PDR-A3 |
| Q1b | PDR-A3 |
| Q1c | PDR-A2 |
| Jalon Reader / conclusion pré-Q2 | PDR-B1 |
| Q2 | PDR-C4 |
| Q3 | PDR-C1 |
| Q3a | PDR-C3 |
| Q3b | PDR-B4 |
| Q3c | PDR-C2 |
| Q3d | PDR-C2 |
| Q3e | PDR-B2 |
| Q4 | PDR-B5 |
| Q5 | PDR-B3 |
| Q6, Q6a | PDR-A4 |
| Q7 | PDR-C6 |
| Q8 | PDR-D1 |
| Q9 | PDR-D3, PDR-G5 |
| Q10, addendum Q10 | PDR-E1, PDR-E2, PDR-E3, PDR-E4, PDR-E5, PDR-E6 |
| Q11 | PDR-D2 |
| Q12 | PDR-C5 |
| Q13 | PDR-F1 |
| Q14 | PDR-F2 |
| Q14a | PDR-F3, PDR-F4 |
| Q15, Q15a, Q15b | PDR-D4, PDR-D5 |
| Q16 | PDR-G6 |
| Q17 | PDR-D6, PDR-G4 |
| Q18 | PDR-D10 |
| Q19 | PDR-D7 |
| Q20 | PDR-D8 |
| Q21 | PDR-D9 |
| Q22 | PDR-G1 |
| Q23 | PDR-G2 |
| Q24 | PDR-G3 |
| Q24′ | PDR-B2, PDR-C7 |

---

## Annexe B — Décisions structurantes (synthèse une page)

| Thème | Décision |
|---|---|
| **Vérité** | Une seule chaîne ; Fabrique productrice ; Reader consommateur pur |
| **Jalon Reader V1** | Premier Chapter Package **complet** ; 7 vues alimentées à l'acceptation |
| **Golden master** | Item 234 — Insuffisance cardiaque — **édition Collège 2023** |
| **Fabrique** | Capitaliser 234 (gates OK) → validation Lou → runtime LLM progressif |
| **Patrimoine** | Sources / packages publiés / données d'apprentissage — zéro perte ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) |
| **Éditions** | Premier diff **2023 → 2026** après golden master |
| **Reader cible** | App installable, offline, sync-ready, 3 appareils Apple d'abord |
| **Lou** | Seule utilisatrice ; mainteneur ≠ Lou |

---

## Annexe C — Matrice PDR → documents normatifs

Vue consolidée pour le suivi de propagation et l'audit de cohérence ([`PRODUCT-DECISION-PROPAGATION-AUDIT.md`](PRODUCT-DECISION-PROPAGATION-AUDIT.md) *(à produire)*).

| Document | Entrées PDR | Statut propagation |
|---|---|---|
| `01-TRUST-AND-FIDELITY.md` | A1 | À faire |
| `02-IDENTITY-AND-ANCHORS.md` | D3, E4, E6, G1 | À faire |
| `04-CHAPTER-PACKAGE.md` | A1, A3, A4, E3, F3, G3, C7 | À faire |
| `05-VISUAL-GRAMMAR.md` | F1, F2, F3, F4 | À faire |
| `06-RENDERER-AND-LEARNER-LAYER.md` | A1, D2–D5, E1, E4–E6, G5 | À faire |
| `14-LOU-READER-ARCHITECTURE.md` | B1, D1–D3, E5, G2, G5 | À faire |
| `15-READER-FUNCTIONAL-SPECIFICATION.md` | A2–A4, B1, B4–B5, D4–D10, E6, G1, G4 | À faire |
| `16-CONTENT-TO-READER-ARCHITECTURE.md` | A1 | À faire |
| `17-PUBLICATION-MODEL.md` | A3, A4, B2, D1, E1–E3, G3, C7 | À faire |
| `18-BUILD-ARCHITECTURE.md` | C1–C6, E2, G6 | À faire |
| `19-BUILD-PIPELINE.md` | A3, B2, C3, C7, E3, F1, F4, G3 | À faire |
| `COMPOSITION-COMPONENT-CONTRACT.md` | A2, A4, B5 | À faire |
| `RENDERER-COMPONENT-CONTRACT.md` | D4, D6, D7 | À faire |
| `ADMIN-OPERATIONS-CONTRACT.md` *(à créer)* | C6 | À faire |
| `LIBRARY-CATALOG-CONTRACT.md` *(à créer)* | D1 | À faire |
| `MASTER_ROADMAP.md` | B1–B3, C1–C2, C4, C6–C7, D1, F1, G2, G6 | Fait — 2026-07-30 |
| `PROJECT_STATE.md` | B1–B2, C1, G6 | Fait — 2026-07-30 |
| [`ADR-006`](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | E1–E4, G3, C7, A4 | Fait |

---

*Registre gelé le 2026-07-30.*
