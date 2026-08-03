---
chapter: cardio/234
scope: full-chapter
revision: phase-4-blueprint
inventory_revision: phase-3c-corrected
# The mental model is projected as a pedagogical block like any other element, so it carries a
# learner-facing question. This is the single canonical origin of that question: a visualSpec's
# `question` is derived from it, never authored independently.
mental_model:
  id: MM-pump-decompensation
  question: "Comment une cardiopathie devient-elle une insuffisance cardiaque qui se décompense ?"
  visual_intent: causal-graph
# Cognitive sequence — intuition → model → physiology → consequences → recognition → diagnosis → etiology → acute → chronic treatment → follow-up.
# Confusion boundaries are sequenced immediately after the concepts they disambiguate.
sequence:
  - ANA-ville-pompe
  - MM-pump-decompensation
  - MEC-output-basics
  - MEC-compensation
  - MEC-remodeling
  - MEC-ef-phenotypes
  - CONF-ef-types
  - MEC-arrhythmia
  - MEC-congestion
  - MEC-systemic-congestion
  - CONF-left-right
  - MEC-oap
  - CONF-transsudat-exsudat
  - CR-recognize
  - CR-diagnose
  - CR-etiology
  - CR-acute
  - CONF-bb-chronic-vs-acute
  - CR-treat-hfref
  - CR-treat-hfpef
  - CONF-ccb-fe-source
  - CR-followup
# Official Visuals (contract C.4). `visual_plan` is the canonical Blueprint declaration of WHETHER
# an element warrants an Official Visual and WHICH primitive it needs; `visual_intent` on an element
# is the narrower activation flag for the intents the current renderer supports, and is the only
# field the build reads. An entry here without `active: true` is declared and not yet built.
# Every visual is optional support: a block whose visual is absent or withheld remains complete,
# because the Guided Walkthrough is the canonical explanation.
visual_plan:
  - { element: MM-pump-decompensation, intent: causal-graph, rationale: "whole-chapter causal cascade", active: true }
  - { element: MEC-compensation, intent: feedback-loop, rationale: "short-term help → long-term harm loop" }
  - { element: MEC-ef-phenotypes, intent: comparison, rationale: "HFrEF vs HFpEF vs HFmrEF" }
  - { element: MEC-oap, intent: process-flow, rationale: "PPC threshold → transudate → OAP", active: true }
  - { element: CONF-transsudat-exsudat, intent: comparison, rationale: "cardiogenic transudate vs lesional exudate" }
  - { element: CR-diagnose, intent: algorithm, rationale: "ESC non-urgent diagnostic path" }
  - { element: CR-acute, intent: algorithm, rationale: "OAP / global flare / shock triage" }
  - { element: CR-treat-hfref, intent: algorithm, rationale: "four disease-modifying classes + diuretic + devices" }
  - { element: CONF-bb-chronic-vs-acute, intent: comparison, rationale: "continue vs stop/reduce beta-blocker by context" }
# Every element projected as a pedagogical block carries a learner-facing question, including
# analogies and confusion boundaries: the block opens on the question the learner actually has.
analogies:
  - id: ANA-ville-pompe
    target: MM-pump-decompensation
    class: scaffolding
    question: "À quoi ressemble une pompe qui n’assure plus, avant tout vocabulaire médical ?"
    note: "Pedagogical scaffolding only — never a sourced medical claim."
mechanisms:
  - id: MEC-output-basics
    question: "Qu’est-ce que l’insuffisance cardiaque, et que signifie « pompe qui échoue » ?"
    steps:
      - "définition physiopathologique : débit inadapté et/ou pressions de remplissage anormales"
      - "syndrome clinique : symptômes ± signes + anomalie structure/fonction"
      - "DC = VES × FC ; VES = VTD − VTS ; FE = VES/VTD"
      - "VES dépend de précharge, postcharge et contractilité"
      - "deux conséquences : ↓ débit (ou incapacité à ↑ à l’effort) et ↑ pressions de remplissage"
    uses_kp: [KP-001, KP-002, KP-005, KP-006]

  - id: MEC-compensation
    question: "Pourquoi le corps aide-t-il d’abord, puis aggrave-t-il ?"
    steps:
      - "compensations utiles à court terme, délétères à long terme"
      - "Starling : étirement → ↑ inotropie jusqu’à une limite de dilatation"
      - "tachycardie sympathique maintient le DC, puis augmente travail et VO₂"
      - "vasoconstriction inhomogène + rétention hydrosodée + activation neurohormonale (sympathique + SRAA)"
      - "boucle : maintien du débit → surcharge / remodelage / aggravation"
    uses_kp: [KP-008, KP-010, KP-011, KP-012]

  - id: MEC-remodeling
    question: "Comment le ventricule se transforme-t-il, et pourquoi la désynchronisation aggrave-t-elle ?"
    steps:
      - "remodelage : dilatation/hypertrophie excentrique ou hypertrophie concentrique (Laplace)"
      - "exemple pédagogique : VTD ↑ / FE ↓ avec VES temporairement conservé"
      - "désynchronisation (ex. BBG) : contraction asynchrone aggravant l’IC"
    uses_kp: [KP-009, KP-013]

  - id: MEC-ef-phenotypes
    question: "En quoi FE diminuée, légèrement diminuée et préservée ne sont-elles pas le même raisonnement ?"
    steps:
      - "HFrEF : défaut de contraction/éjection ; FE ≤ 40 %"
      - "HFpEF : défaut de remplissage ; FE ≥ 50 % ; plus fréquente sujet âgé/femme, HTA, obésité"
      - "HFmrEF 41–49 % : se rapproche de l’HFrEF ; distinction surtout thérapeutique"
    uses_kp: [KP-014, KP-015, KP-016]
    confusion: [CONF-ef-types]

  - id: MEC-arrhythmia
    question: "Comment les arythmies interagissent-elles avec l’insuffisance cardiaque ?"
    steps:
      - "FA favorisée par dilatation atriale ; perte de systole atriale → aggravation IC + risque d’AVC"
      - "arythmies ventriculaires graves (TV/FV) : principale cause de mort subite → intérêt du DAI"
    uses_kp: [KP-017, KP-018]

  - id: MEC-congestion
    question: "Pourquoi la congestion pulmonaire apparaît-elle quand le VG dysfonctionne ?"
    steps:
      - "dysfonctionnement VG → pression télédiastolique ↑"
      - "transmission OG → veines pulmonaires → capillaires pulmonaires"
      - "congestion pulmonaire / pression capillaire ↑"
    uses_kp: [KP-040]

  - id: MEC-systemic-congestion
    question: "Pourquoi la dysfonction droite (ou globale) produit-elle une stase systémique ?"
    steps:
      - "pressions diastoliques VD transmises à l’OD"
      - "transmission à la circulation veineuse systémique"
      - "stase hépatique et jugulaire"
    uses_kp: [KP-007]
    confusion: [CONF-left-right]

  - id: MEC-oap
    question: "Comment la congestion pulmonaire mène-t-elle à l’OAP ?"
    steps:
      - "pression capillaire pulmonaire ↑ (suite de MEC-congestion)"
      - "franchissement du seuil PPC > 25 mmHg"
      - "passage transsudat → alvéoles"
      - "œdème aigu pulmonaire cardiogénique"
    uses_kp: [KP-041]
    confusion: [CONF-transsudat-exsudat]
    visual_intent: process-flow

clinical_reasoning:
  - id: CR-recognize
    question: "Devant quels symptômes et signes dois-je penser à une insuffisance cardiaque ?"
    steps:
      - "diagnostic difficile : symptômes non spécifiques, signes peu sensibles ; dysfonction asymptomatique possible"
      - "épidémiologie de cadrage : prévalence 1–2 %, âge moyen au diagnostic 75–80 ans"
      - "dyspnée d’effort (NYHA) ; orthopnée / DPN plus spécifiques"
      - "signes trompeurs (asthme cardiaque, toux, hémoptysies) ; OAP comme manifestation"
      - "fatigue, œdèmes, hépatalgie ; signes physiques souvent pauvres sous traitement"
      - "signes cardiaques / pulmonaires / PA / congestion droite"
    uses_kp:
      [KP-003, KP-004, KP-019, KP-020, KP-021, KP-022, KP-023, KP-024, KP-025,
       KP-026, KP-027, KP-028, KP-029, KP-030]

  - id: CR-diagnose
    question: "Comment confirmer ou infirmer une IC hors (et en) urgence ?"
    steps:
      - "ECG peu contributif au diagnostic positif ; BBG/QRS importants pour la thérapeutique"
      - "radio : cardiomégalie non obligatoire ; sémiologie de stase"
      - "BNP/NT-proBNP : étirement myocytaire, bonne VPN ; seuils de rule-out en dyspnée aiguë"
      - "facteurs confondants des peptides ; zone grise → clinique"
      - "ETT (+ Doppler) = examen clé indispensable"
      - "algorithme ESC 2021 hors urgence : NP puis écho si non rule-out"
    uses_kp: [KP-032, KP-033, KP-034, KP-035, KP-036, KP-038, KP-039, KP-043]

  - id: CR-etiology
    question: "Quelle est la cause (ou le facteur aggravant) chez ce patient ?"
    steps:
      - "chercher une cause traitable / réversible en parallèle du syndrome"
      - "ischémie = 1re cause ; coronarographie si FEVG diminuée selon contexte"
      - "HTA, CMD, restrictives/amylose, valvulopathies, rythme/conduction, péricarde"
      - "IC droite le plus souvent secondaire à l’IC gauche ; causes isolées possibles"
      - "CMH et autres cardiomyopathies à ne pas méconnaître"
      - "prévention / traitement étiologique (FDR, valves, reperfusion, toxiques, rythme…)"
    uses_kp:
      [KP-045, KP-050, KP-051, KP-052, KP-053, KP-054, KP-055, KP-056, KP-057,
       KP-072, KP-073]

  - id: CR-acute
    question: "Face à une décompensation aiguë, quel est mon triage et ma logique de traitement ?"
    steps:
      - "IC aiguë = apparition rapide (de novo ou aggravation) ; souvent IV / hospitalisation"
      - "OAP cardiogénique = urgence de congestion alvéolaire ; différentiels de dyspnée aiguë"
      - "chercher un facteur déclenchant ; mnémonique CHAMPIT"
      - "SCA associé → prise en charge simultanée"
      - "choc cardiogénique = hypoperfusion / PAS basse → inotropes / assistance"
      - "OAP domicile → hôpital : position, diurétique, nitrés selon PA, O₂ ; pas d’introduction de BB"
      - "poussée globale sans OAP franc : diurétiques IV, rééquilibrage, cause"
    uses_kp:
      [KP-059, KP-060, KP-061, KP-062, KP-063, KP-099, KP-100, KP-103, KP-104,
       KP-105, KP-106, KP-109]
    confusion: [CONF-bb-chronic-vs-acute]

  - id: CR-treat-hfref
    question: "Comment traiter l’IC chronique à FE diminuée (et légèrement diminuée) ?"
    steps:
      - "état chronique = hors décompensation aiguë, traitement oral ambulatoire"
      - "mesures générales : hyposodé prudent, poids, alcool/tabac, activité, vaccinations"
      - "quatre classes réduisant mortalité/décompensations (FE ≤ 40 %) + diurétique de congestion"
      - "IEC (± ARNI), ARA2 si intolérance ; BB validés ; ARM ; gliflozines"
      - "HFmrEF : mêmes traitements possibles, niveau de preuve moindre"
      - "contraintes : amiodarone si antiarythmique ; CI diltiazem/vérapamil/flécaïnide/AINS en IC systolique"
      - "dihydropyridines possibles si indication associée ; CRT / DAI selon critères"
    uses_kp:
      [KP-064, KP-074, KP-075, KP-076, KP-077, KP-078, KP-079, KP-080, KP-081,
       KP-082, KP-083, KP-084, KP-085, KP-087, KP-089, KP-090, KP-091, KP-092]
    confusion: [CONF-bb-chronic-vs-acute, CONF-ccb-fe-source]

  - id: CR-treat-hfpef
    question: "Comment raisonner le traitement de l’IC à FE préservée ?"
    steps:
      - "critères diagnostiques HFpEF : symptômes/signes + FE ≥ 50 % + NP ↑ + arguments de remplissage/HVG/AG"
      - "traitement peu codifié ; éviter déclencheurs (HTA, FA, surcharge)"
      - "gliflozines récemment efficaces ; logique ABCDEFG"
      - "ne pas importer automatiquement toutes les règles de l’IC systolique — voir CONF-ccb-fe-source"
    uses_kp: [KP-065, KP-096]
    confusion: [CONF-ccb-fe-source]

  - id: CR-followup
    question: "Que surveiller dans le temps, et comment prévenir réhospitalisations et complications ?"
    steps:
      - "histoire naturelle : dysfonction asymptomatique → IC ; oscillations stabilité/décompensations"
      - "mortalité et hospitalisations élevées ; mort subite ou IC réfractaire"
      - "complications et comorbidités à prendre en charge"
      - "parcours post-hospitalisation, éducation, réadaptation, soins de support"
      - "télésurveillance (PA/FC/poids) pour dépister tôt une décompensation"
    uses_kp: [KP-066, KP-067, KP-068, KP-069, KP-071, KP-097, KP-098]

confusion:
  - id: CONF-ef-types
    question: "Pourquoi « FE basse ou FE normale » ne peut-il pas être traité comme un simple binaire ?"
    a: "IC à FE diminuée = défaut d’éjection (et logique thérapeutique des 4 classes)"
    b: "IC à FE préservée = défaut de remplissage (critères et traitement distincts)"
    note: "HFmrEF est une zone intermédiaire à distinction surtout thérapeutique — ne pas l’effacer dans un binaire."
    uses_kp: [KP-014, KP-015, KP-016]

  - id: CONF-left-right
    question: "Comment distinguer congestion gauche et congestion droite, et pourquoi vont-elles souvent ensemble ?"
    a: "Congestion gauche / pulmonaire : pressions VG → OG → capillaires pulmonaires"
    b: "Congestion droite / systémique : pressions VD → OD → veines systémiques (jugulaires, foie, œdèmes)"
    note: "L’IC droite est le plus souvent secondaire à l’IC gauche (IC globale), mais des causes isolées existent."
    uses_kp: [KP-007, KP-040, KP-030, KP-057]

  - id: CONF-transsudat-exsudat
    question: "Pourquoi tout œdème aigu pulmonaire n’est-il pas un OAP cardiogénique ?"
    a: "OAP cardiogénique = transsudat (pression hydrostatique)"
    b: "OAP lésionnel = exsudat (membrane alvéolo-capillaire lésée)"
    uses_kp: [KP-041, KP-042]

  - id: CONF-bb-chronic-vs-acute
    question: "Faut-il poursuivre ou arrêter le bêtabloquant devant une décompensation ?"
    a: "Contexte chronique / hospitalisation pour décompensation (hors OAP VII.A) : généralement poursuivre le bêtabloquant sauf échec de réponse ou choc"
    b: "Contexte OAP aigu (VII.A) : ne pas introduire de BB ; si déjà sous BB → généralement arrêt ou ↓ posologie"
    note: "Source conflict seg-ambig-bb-stop — do not collapse into one universal rule."
    uses_kp: [KP-081, KP-103]

  - id: CONF-ccb-fe-source
    question: "Les inhibiteurs calciques sont-ils interdits dans l’insuffisance cardiaque ?"
    a: "VI.C.8 : diltiazem/vérapamil contre-indiqués dans l’IC systolique ; dihydropyridines utilisables si indication associée"
    b: "VI.F ABCDEFG : inhibiteur calcique ralentisseur peut baisser la FC dans la logique HFpEF ; Notions inacceptables portent un libellé conflictuel sur FE préservée"
    note: "Source conflict seg-ambig-fe-ci-notions — keep explicit; do not invent a universal CCB rule."
    uses_kp: [KP-089, KP-090, KP-096]
---

## ANA-ville-pompe

Scaffolding only. A city whose water pump fails: pressure rises upstream (flooding streets) while delivery downstream becomes inadequate. Use to open intuition before any College claim. Never present as a sourced medical fact.

## MM-pump-decompensation

A cardiopathy damages the pump → cardiac output becomes inadequate and/or filling pressures rise → short-term compensations help, then harm → remodeling and phenotype (reduced vs preserved EF) shape the clinical picture → congestion (pulmonary and/or systemic) and acute decompensations punctuate a chronic disease with high hospitalization and mortality burden.

This is the single reusable chapter model for Story, Overview, Mechanisms, and Clinical reasoning projections.

## MEC-output-basics

Heart failure is both a pathophysiological failure of the pump and a clinical syndrome. Hemodynamic formulas make “output” and “ejection fraction” measurable without equating FE with the whole disease.

## MEC-compensation

Compensatory loops (Starling, tachycardia, vasoconstriction, salt/water retention, sympathetic + RAAS) buy time, then raise workload and drive decompensation. One mechanism, not four isolated facts.

## MEC-remodeling

Structural remodeling (and electrical desynchronization) is how compensation becomes durable damage — and why reverse remodeling under treatment matters later.

## MEC-ef-phenotypes

Reduced, mildly reduced, and preserved EF are related pump-failure phenotypes with different dominant mechanisms and different treatment logics. Keep them distinguishable.

## MEC-arrhythmia

Atrial and ventricular arrhythmias are both consequence and aggravator of HF; sudden death risk links physiology to device therapy later.

## MEC-congestion

Left-ventricular dysfunction raises filling pressure that is transmitted upstream into the pulmonary venous/capillary bed — the congestion substrate for cardiogenic OAP.

## MEC-systemic-congestion

Right-sided (or biventricular) pressure transmission produces systemic venous congestion. Keep distinct from pulmonary congestion while recognizing that isolated right HF is less common than secondary right involvement.

## MEC-oap

Crossing a pulmonary capillary pressure threshold (generally at least **PPC > 25 mmHg**) drives alveolar transudation — cardiogenic OAP — which must remain distinguishable from lesional exudative edema.

## CONF-ef-types

Do not teach “one heart-failure treatment.” FE phenotype changes both pathophysiology emphasis and therapeutic strategy.

## CONF-left-right

Left/pulmonary vs right/systemic congestion answer different clinical pictures; global HF is common, isolated right HF is a separate etiological question.

## CONF-transsudat-exsudat

Cardiogenic OAP = hydrostatic transudate. Lesional OAP = membrane injury exudate. Same breathless emergency, different mechanism and work-up implications.

## CR-recognize

Build a recognition scaffold from imperfect sensitivity/specificity: effort dyspnea and congestion signs, with OAP as the extreme pulmonary expression.

## CR-diagnose

Move from suspicion to confirmation with NP logic, chest imaging pattern, and echocardiography as the indispensable structural/functional exam, following the non-urgent ESC pathway when applicable.

## CR-etiology

Every HF syndrome needs a cause hunt — ischemic first, then hypertensive, myocardial, valvular, rhythm, pericardial, and right-sided pathways — because etiology can be treatable.

## CR-acute

Triage acute HF along congestion vs hypoperfusion axes: OAP, global flare without frank OAP, cardiogenic shock; search triggers (CHAMPIT); treat the emergency without erasing the chronic disease plan.

## CONF-bb-chronic-vs-acute

Beta-blocker handling is context-dependent. Chronic/hospital keep-on-BB logic (unless failure/shock) is not the same instruction as acute OAP stop/reduce. Preserve both poles.

## CR-treat-hfref

Chronic HFrEF care = lifestyle/education + four mortality-reducing classes + congestion diuretic + selected antiarrhythmic/device strategies, with explicit drug contraindications for systolic HF.

## CR-treat-hfpef

HFpEF is diagnosed by a cluster of criteria and managed with a less codified, trigger-avoidance + gliflozin-centered logic — not a silent copy of HFrEF protocols.

## CONF-ccb-fe-source

College wording about rate-slowing calcium-channel blockers is not internally uniform across systolic-HF contraindications, HFpEF ABCDEFG allowances, and “Notions inacceptables.” Keep the ambiguity explicit for later projections.

## CR-followup

HF is a long disease of oscillations: prognosis, complications, comorbidities, care pathway, and remote monitoring exist to catch decompensation early and reduce rehospitalization.
