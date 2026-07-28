---
chapter: cardio/330
scope: full-chapter
revision: phase-4-blueprint
inventory_revision: initial-v1
mental_model:
  id: MM-antithrombotic-pipeline
  question: "Comment raisonner la prescription des antithrombotiques de l'hémostase primaire à la fibrinolyse ?"
sequence:
  - ANA-caillot-trois-voies
  - MM-antithrombotic-pipeline
  - MEC-hemostasis-classes
  - MEC-aspirin
  - MEC-p2y12
  - MEC-gpiib
  - MEC-heparins
  - CONF-hnf-hbpm-renal
  - MEC-avk
  - MEC-aod
  - CONF-aod-vs-avk
  - MEC-thrombolytics
  - CR-prescribe-antiplatelet
  - CR-prescribe-heparin
  - CR-prescribe-avk
  - CR-prescribe-aod
  - CR-manage-bleeding
  - CR-manage-tih
analogies:
  - id: ANA-caillot-trois-voies
    target: MM-antithrombotic-pipeline
    class: scaffolding
    question: "Comment se forme un caillot, et où peut-on intervenir ?"
    note: "Pedagogical scaffolding only — never a sourced medical claim."
mechanisms:
  - id: MEC-hemostasis-classes
    question: "Quelles sont les trois grandes familles antithrombotiques et leurs cibles ?"
    steps:
      - "antiplaquettaires → hémostase primaire / agrégation plaquettaire"
      - "anticoagulants → phase de coagulation (facteurs)"
      - "fibrinolytiques → destruction du caillot formé"
    uses_kp: [KP-001, KP-002]

  - id: MEC-aspirin
    question: "Comment l'aspirine agit-elle, à quelle dose, et comment la surveiller ?"
    steps:
      - "inhibition Cox → ↓ thromboxane A2 ; effet plaquettaire irréversible 7–10 j"
      - "entretien 75–100 mg/j ; charge 300 mg ; prévention secondaire à vie"
      - "pas de test biologique fiable ; tolérance clinique et NFS annuelle"
      - "règles péri-op stent et arrêt bref si risque hémorragique majeur"
    uses_kp: [KP-003, KP-004, KP-005, KP-006, KP-007, KP-008, KP-009]

  - id: MEC-p2y12
    question: "En quoi les inhibiteurs P2Y12 diffèrent-ils de l'aspirine ?"
    steps:
      - "blocage récepteur P2Y12 voie ADP, additif à l'aspirine"
      - "clopidogrel prodrogue CYP2C19 ; prasugrel/ticagrélor plus puissants"
      - "posologies charge + entretien ; DAPT 12 mois post-SCA modulée par saignement"
      - "CI prasugrel ATCD AVC ; ticagrélor dyspnée/bradycardie"
    uses_kp: [KP-010, KP-011, KP-012, KP-013, KP-014, KP-015]

  - id: MEC-gpiib
    question: "Quand utilise-t-on les anti-GPIIb/IIIa ?"
    steps:
      - "blocage récepteur fibrinogène plaquettaire"
      - "voie IV courte, angioplastie à haut risque thrombotique"
      - "risque hémorragique important, usage en recul depuis nouveaux AAP"
    uses_kp: [KP-016]

  - id: MEC-heparins
    question: "Comment fonctionnent et se surveillent les héparines ?"
    steps:
      - "HNF/HBPM activent antithrombine ; fondaparinux anti-Xa"
      - "HNF bolus 80 UI/kg puis perfusion ; HBPM selon poids anti-Xa"
      - "surveillance HNF par TCA ×2–3 ; HBPM sans monitoring si poids correct"
      - "indications TVP/EP, SCA, prophylaxie ; TIH immuno-allergique"
    uses_kp: [KP-017, KP-018, KP-019, KP-020, KP-021, KP-022, KP-023, KP-024, KP-025, KP-026]
    confusion: [CONF-hnf-hbpm-renal]

  - id: MEC-avk
    question: "Comment instaurer et surveiller un traitement par AVK ?"
    steps:
      - "blocage synthèse facteurs II VII IX X ; efficacité à 3–5 j"
      - "relais héparine obligatoire : chevauchement 4–5 j + 2 INR efficaces"
      - "INR cible 2–3 ; équilibre ≥70 % dans la cible"
      - "antidotes PPSB et vitamine K ; tératogènes 1er trimestre"
    uses_kp: [KP-027, KP-028, KP-029, KP-030, KP-031, KP-032, KP-033]

  - id: MEC-aod
    question: "Que changent les anticoagulants oraux directs par rapport aux AVK ?"
    steps:
      - "anti-IIa (dabigatran) ou anti-Xa (rivaroxaban, apixaban)"
      - "élimination rénale variable ; adapter Cockcroft ; CI si ClCr <25–30"
      - "efficacité ~2 h, pas de relais héparine pour indication établie"
      - "pas de monitoring routine ; CI valves mécaniques et RM serré"
    uses_kp: [KP-034, KP-035, KP-036, KP-037, KP-038, KP-039, KP-040]
    confusion: [CONF-aod-vs-avk]

  - id: MEC-thrombolytics
    question: "Quand lyser un caillot, et à quel prix hémorragique ?"
    steps:
      - "activateurs plasminogène : altéplase, ténectéplase"
      - "IDM <6–12 h, AVC <4 h 30, EP grave"
      - "risque HIC 0,7–2 % ; CI hémorragiques nombreuses"
    uses_kp: [KP-041, KP-042, KP-043, KP-044]

clinical_reasoning:
  - id: CR-prescribe-antiplatelet
    question: "Comment prescrire et adapter les antiagrégants plaquettaires ?"
    steps:
      - "aspirine entretien 75 mg ; DAPT aspirine + P2Y12 post-SCA/stent"
      - "durée DAPT 1–12 mois selon risque hémorragique"
      - "ne pas arrêter aspirine pour actes modérés ; arrêt bref si risque majeur"
      - "pas de surveillance biologique routine"
    uses_kp: [KP-004, KP-008, KP-009, KP-014, KP-015, KP-052]

  - id: CR-prescribe-heparin
    question: "Comment prescrire une héparine curative ou préventive ?"
    steps:
      - "choisir HNF si IR sévère ; HBPM/fondaparinux sinon avec poids exact"
      - "HNF : bolus + perfusion, TCA quotidien dès H5"
      - "HBPM : posologie anti-Xa/kg, pas de monitoring si IR normale"
      - "NFS plaquettes si traitement prolongé ; penser TIH"
    uses_kp: [KP-019, KP-021, KP-022, KP-023, KP-025]

  - id: CR-prescribe-avk
    question: "Comment débuter un AVK et gérer le relais héparine ?"
    steps:
      - "warfarine référence ; début précoce J1 avec héparine en parallèle"
      - "exemple warfarine 5 mg J0–J2 ; INR matin J4"
      - "arrêt héparine si 2 INR efficaces espacés 24 h"
      - "éducation thérapeutique et interactions médicamenteuses"
    uses_kp: [KP-027, KP-029, KP-030, KP-032, KP-053]

  - id: CR-prescribe-aod
    question: "Comment choisir et adapter un AOD ?"
    steps:
      - "vérifier fonction rénale Cockcroft et CI valve mécanique/RM"
      - "posologie selon indication (FA, TVP-EP, prophylaxie orthopédique)"
      - "pas de relais héparine si indication établie"
      - "ne pas interpréter INR/TCA pour surveiller l'effet"
    uses_kp: [KP-035, KP-036, KP-037, KP-038, KP-039, KP-040, KP-053, KP-054]

  - id: CR-manage-bleeding
    question: "Comment prendre en charge un saignement sous anticoagulant ?"
    steps:
      - "héparine : protamine si majeur ; adapter doses si surdosage TCA"
      - "AVK surdosage asymptomatique selon INR ; vitamine K si INR élevé"
      - "AVK hémorragie grave : CCP + vitamine K, transfusion, geste hémostatique"
      - "AOD : temps depuis dernière prise ; idarucizumab si dabigatran ; PPSB/Feiba anti-Xa"
    uses_kp: [KP-020, KP-045, KP-048, KP-049, KP-050, KP-051]

  - id: CR-manage-tih
    question: "Comment suspecter et traiter une thrombopénie induite par l'héparine ?"
    steps:
      - "type II immune J5–10 : risque thrombotique paradoxal"
      - "plaquettes <100 G/L ou chute 30–50 % ; score 4T"
      - "arrêt immédiat toute héparine si forte suspicion"
      - "danaparoïde, fondaparinux ou AOD en relais ; carte TIH"
    uses_kp: [KP-046, KP-047, KP-026]

confusion:
  - id: CONF-hnf-hbpm-renal
    question: "Quand utiliser HNF plutôt que HBPM ou fondaparinux ?"
    a: "HBPM/fondaparinux : SC pratique, pas de monitoring si poids et fonction rénale OK"
    b: "HNF : seul anticoagulant en insuffisance rénale sévère (ClCr <20–30) ; surveillance TCA"
    note: "HBPM et fondaparinux CI si ClCr <30 mL/min — notion inacceptable à ne pas violer."
    uses_kp: [KP-019, KP-054]

  - id: CONF-aod-vs-avk
    question: "Quand préférer un AOD à un AVK ?"
    a: "AOD : action rapide, pas de monitoring INR, moins d'hémorragies intracrâniennes"
    b: "AVK : valves mécaniques, IR sévère ; relais héparine à l'instauration"
    note: "Valves mécaniques et RM serré = CI absolue AOD."
    uses_kp: [KP-033, KP-039, KP-053, KP-054]
---

## ANA-caillot-trois-voies

Scaffolding only. A clot forms in three steps: platelets stick (primary hemostasis), coagulation factors build fibrin (secondary), and fibrinolysis can dissolve the clot. Antiplatelets, anticoagulants, and fibrinolytics each hit a different step.

## MM-antithrombotic-pipeline

The chapter's reusable model: match the drug class to the clot mechanism — antiplatelets for arterial thrombosis, anticoagulants for coagulation phase (venous and cardioembolic), fibrinolytics for established clot lysis — then prescribe, monitor (or accept no monitoring), and manage bleeding complications.

## MEC-hemostasis-classes

Three families map to three hemostasis phases. This is the taxonomy for the whole item.

## MEC-aspirin

Oldest antiplatelet; irreversible COX inhibition; low-dose maintenance; no lab monitoring; perioperative rules after stenting.

## MEC-p2y12

P2Y12 blockers add to aspirin in high-risk coronary settings; metabolizer issues with clopidogrel; potency and CI differ by molecule.

## MEC-gpiib

IV-only GPIIb/IIIa inhibitors for high-risk PCI; declining use; major bleeding risk.

## MEC-heparins

Rapid anticoagulation via antithrombin (or anti-Xa for fondaparinux); HNF needs TCA monitoring; renal function drives molecule choice.

## CONF-hnf-hbpm-renal

Renal failure is the main fork between HNF and HBPM/fondaparinux.

## MEC-avk

Oral long-term anticoagulation with delayed onset; INR monitoring; mandatory heparin overlap at initiation.

## MEC-aod

Direct oral anticoagulants simplify initiation but require renal dosing and have absolute CI in mechanical valves.

## CONF-aod-vs-avk

AOD largely replace AVK except mechanical valves and severe renal failure.

## MEC-thrombolytics

Clot lysis in time-limited emergencies with significant ICH risk.

## CR-prescribe-antiplatelet

Clinical prescription logic for aspirin and DAPT duration/bleeding trade-offs.

## CR-prescribe-heparin

Weight-based HBPM vs monitored HNF infusion.

## CR-prescribe-avk

Warfarin initiation schedule and heparin overlap rules.

## CR-prescribe-aod

Renal-adjusted dosing without INR surveillance.

## CR-manage-bleeding

Class-specific reversal: protamine, vitamin K/CCP, idarucizumab/PPSB.

## CR-manage-tih

TIH is thrombotic, not hemorrhagic — stop heparin and anticoagulate with alternative.
