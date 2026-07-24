---
type: understanding.overview
projects:
  - MM-pump-decompensation
  - MEC-output-basics
  - MEC-compensation
  - MEC-ef-phenotypes
  - MEC-congestion
  - MEC-oap
  - CR-recognize
  - CR-diagnose
  - CR-treat-hfref
  - CR-treat-hfpef
provenance:
  source_edition: 2024-SFC
  blueprint_revision: phase-4-blueprint
  methodology_version: phase-5-v1
---

# Carte mentale — Item 234

Relis cette page en quelques minutes pour reconstruire le chapitre. Les détails causaux sont dans **Pourquoi ?** ; la décision clinique dans **Raisonnement clinique**.

## 1. Qu’est-ce que l’insuffisance cardiaque ?

Deux faces complémentaires :
- **Physiopathologie** : incapacité à délivrer un débit adapté et/ou à fonctionner avec des pressions de remplissage normales. {#cb-ov-def-physio}
- **Syndrome clinique** : symptômes ± signes + anomalie de structure/fonction → débit insuffisant et/ou pressions intracardiaques ↑. {#cb-ov-def-clinic}

## 2. Que se passe-t-il fondamentalement ?

| Conséquence | Sens clinique |
|---|---|
| ↓ débit (ou incapacité à ↑ à l’effort) | fatigue, bas débit |
| ↑ pressions de remplissage transmises en amont | congestion |

Formules utiles pour parler « pompe » : **DC = VES × FC** ; **VES = VTD − VTS** ; **FE = VES/VTD** ; le VES dépend de précharge, postcharge et contractilité. {#cb-ov-formulas}

## 3. Que fait le corps en réponse ?

Compensations **utiles à court terme, délétères à long terme** : Starling, tachycardie sympathique, vasoconstriction, rétention hydrosodée, activation neurohormonale (sympathique + SRAA). {#cb-ov-compensation}

## 4. Pourquoi la compensation devient-elle nuisible ?

Elle maintient le débit un temps, puis augmente le travail cardiaque, favorise le **remodelage** et prépare les décompensations. La boucle « aide → surcharge → aggravation » est le cœur du modèle. {#cb-ov-maladaptive}

## 5. Quelles conséquences apparaissent ?

**Congestion pulmonaire** (VG → OG → capillaires) et/ou **stase systémique** (VD → OD → veines). {#cb-ov-congestion-sides}

Si la pression capillaire pulmonaire dépasse un seuil, un **transsudat** envahit les alvéoles → **OAP cardiogénique** — à ne pas confondre avec l’**exsudat** de l’OAP lésionnel. {#cb-overview-oap}

Arythmies : FA (aggravation + risque d’AVC) ; TV/FV (mort subite → intérêt du DAI). {#cb-ov-arrhythmia}

## 6. Comment reconnaître et classer ?

**Reconnaître** : dyspnée d’effort (NYHA), orthopnée / DPN plus spécifiques, signes de congestion ; le diagnostic reste difficile (symptômes non spécifiques). {#cb-ov-recognize}

**Classer par FE** (phénotypes liés, logiques distinctes) :

| Phénotype | FE | Idée dominante |
|---|---|---|
| HFrEF | ≤ 40 % | défaut d’éjection |
| HFmrEF | 41–49 % | proche HFrEF ; distinction surtout thérapeutique |
| HFpEF | ≥ 50 % | défaut de remplissage |

{#cb-ov-ef}

## 7. Comment raisonner le diagnostic ?

Suspicion → **peptides natriurétiques** (bonne VPN) → **échocardiographie** (examen clé) ; ECG peu contributif au diagnostic positif mais important pour la thérapeutique (BBG/QRS). {#cb-ov-diagnose}

En parallèle : chercher une **cause traitable** (ischémie en premier).

## 8. Comment le traitement découle-t-il des mécanismes ?

| Situation | Logique |
|---|---|
| Congestion | diurétiques (vider l’excès) |
| HFrEF (FE ≤ 40 %) | 4 classes qui ↓ mortalité/décompensations + diurétique de congestion {#cb-ov-hfref} |
| HFpEF | moins codifié ; éviter déclencheurs ; gliflozines {#cb-ov-hfpef} |
| Aigu | triage congestion vs hypoperfusion ; traiter le facteur déclenchant |

Les règles des inhibiteurs calciques et des bêtabloquants **dépendent du contexte** (FE, chronique vs OAP) — détail dans le raisonnement clinique, sans règle unique inventée.

<!-- claim-trace
claims:
  - id: cb-ov-def-physio
    class: sourced
    element: MEC-output-basics
    kp: [KP-001]
  - id: cb-ov-def-clinic
    class: sourced
    element: MEC-output-basics
    kp: [KP-002]
  - id: cb-ov-formulas
    class: sourced
    element: MEC-output-basics
    kp: [KP-005, KP-006]
  - id: cb-ov-compensation
    class: sourced
    element: MEC-compensation
    kp: [KP-008]
  - id: cb-ov-maladaptive
    class: sourced
    element: MEC-compensation
    kp: [KP-008, KP-009]
  - id: cb-ov-congestion-sides
    class: sourced
    element: MEC-congestion
    kp: [KP-040, KP-007]
  - id: cb-overview-oap
    class: bridging
    element: MEC-oap
    kp: [KP-040, KP-041, KP-042]
  - id: cb-ov-arrhythmia
    class: sourced
    element: MEC-arrhythmia
    kp: [KP-017, KP-018]
  - id: cb-ov-recognize
    class: sourced
    element: CR-recognize
    kp: [KP-003, KP-019, KP-020]
  - id: cb-ov-ef
    class: sourced
    element: MEC-ef-phenotypes
    kp: [KP-014, KP-015, KP-016]
  - id: cb-ov-diagnose
    class: sourced
    element: CR-diagnose
    kp: [KP-032, KP-035, KP-039]
  - id: cb-ov-hfref
    class: sourced
    element: CR-treat-hfref
    kp: [KP-077]
  - id: cb-ov-hfpef
    class: sourced
    element: CR-treat-hfpef
    kp: [KP-096]
-->
