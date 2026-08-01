---
type: understanding.overview
projects: [MM-pump-decompensation]
provenance:
  source_edition: 2022
  blueprint_revision: phase-4-blueprint
  methodology_version: phase-5-v1
---

# Vue d'ensemble — la carte du chapitre

Un seul bloc : le modèle complet de l'item, parcouru du début à la fin. Reviens ici quand tu veux reconstruire le chapitre de mémoire.

## Comment une cardiopathie devient-elle une insuffisance cardiaque qui se décompense ? {#MM-pump-decompensation}

Le chapitre entier tient dans une chaîne, et chaque maillon explique le suivant. On la parcourt une fois complètement ici ; les blocs de **Pourquoi ?** et de **Raisonnement clinique** reprennent ensuite chaque maillon en détail.

Tout part d'une définition à deux faces. Sur le plan physiopathologique, l'insuffisance cardiaque est l'incapacité du cœur à délivrer un débit adapté aux besoins de l'organisme. {#cb-ov-def-physio} Sur le plan clinique, c'est un syndrome : des symptômes, avec ou sans signes, expliqués par une anomalie de structure ou de fonction cardiaque, aboutissant à un débit insuffisant et/ou à des pressions intracardiaques élevées. {#cb-ov-def-clinic} Les deux faces décrivent le même patient — retenir une seule des deux est la source d'erreur la plus fréquente sur cet item.

Pour parler « pompe » de façon mesurable, trois relations suffisent : le débit cardiaque est le produit du volume d'éjection systolique par la fréquence, ce volume est la différence entre volume télédiastolique et télésystolique, et la fraction d'éjection en est le rapport ; le volume d'éjection dépend lui-même de la précharge, de la postcharge et de la contractilité. {#cb-ov-formulas} Ces formules ne sont pas là pour être récitées : elles montrent que la fraction d'éjection n'est qu'une manière de regarder la pompe, pas la maladie entière.

De la définition découlent directement deux conséquences, et c'est le nœud du modèle : un débit qui devient insuffisant — ou qui n'augmente plus à l'effort — donne la fatigue et le bas débit ; des pressions de remplissage élevées, transmises en amont, donnent la congestion. Presque tout le tableau clinique se déduit de ce couple.

Le corps ne subit pas passivement : il compense. Loi de Starling, tachycardie sympathique, vasoconstriction, rétention hydrosodée, activation neurohormonale sympathique et du système rénine-angiotensine-aldostérone — utiles à court terme, délétères à long terme. {#cb-ov-compensation} C'est le point de bascule du chapitre : ces mêmes réponses maintiennent le débit un temps, puis augmentent le travail cardiaque, favorisent le remodelage et préparent les décompensations. La boucle « aide → surcharge → aggravation » est ce qu'il faut pouvoir redessiner. {#cb-ov-maladaptive}

Les conséquences apparaissent alors des deux côtés du cœur : congestion pulmonaire lorsque les pressions gauches se transmettent vers l'oreillette gauche puis les capillaires pulmonaires, stase systémique lorsque les pressions droites se transmettent vers l'oreillette droite et les veines. {#cb-ov-congestion-sides} Quand la pression capillaire pulmonaire franchit un seuil, en général **> 25 mmHg**, un transsudat envahit les alvéoles : c'est l'OAP cardiogénique, à ne pas confondre avec l'exsudat de l'OAP lésionnel. {#cb-overview-oap} S'y ajoutent les arythmies, qui sont à la fois conséquence et aggravateur : la fibrillation atriale aggrave l'insuffisance cardiaque et expose à l'AVC, les arythmies ventriculaires graves sont la principale cause de mort subite. {#cb-ov-arrhythmia}

Côté reconnaissance, l'entrée habituelle est la dyspnée d'effort, cotée par la NYHA, avec l'orthopnée et la dyspnée paroxystique nocturne comme signes plus spécifiques, et les signes de congestion à l'examen ; le diagnostic reste difficile parce que les symptômes ne sont pas spécifiques. {#cb-ov-recognize} Le classement se fait ensuite par la fraction d'éjection, en trois phénotypes liés mais de logiques distinctes :

| Phénotype | FE | Idée dominante |
|---|---|---|
| HFrEF | ≤ 40 % | défaut d'éjection |
| HFmrEF | 41–49 % | proche de l'HFrEF ; distinction surtout thérapeutique |
| HFpEF | ≥ 50 % | défaut de remplissage |

{#cb-ov-ef}

Le raisonnement diagnostique suit la même logique d'économie : devant une suspicion, les peptides natriurétiques servent surtout à éliminer grâce à leur bonne valeur prédictive négative, puis l'échocardiographie est l'examen clé ; l'ECG est peu contributif au diagnostic positif mais compte pour la thérapeutique, notamment par le bloc de branche gauche et la largeur du QRS. {#cb-ov-diagnose} En parallèle, on cherche toujours une cause traitable, l'ischémie en premier.

Le traitement, enfin, se déduit du mécanisme plutôt que d'une liste. La congestion appelle les diurétiques. Dans l'insuffisance cardiaque à FE diminuée, quatre classes réduisent la mortalité et les décompensations, auxquelles s'ajoute le diurétique de congestion. {#cb-ov-hfref} Dans l'insuffisance cardiaque à FE préservée, le traitement est moins codifié : éviter les déclencheurs, et les gliflozines ont récemment montré leur efficacité. {#cb-ov-hfpef} En aigu, tout commence par un triage entre congestion et hypoperfusion, avec la recherche du facteur déclenchant.

Deux règles refusent volontairement d'être simplifiées ici : celle des inhibiteurs calciques et celle des bêtabloquants dépendent du contexte — fraction d'éjection, situation chronique ou OAP. Elles sont traitées comme telles dans **Raisonnement clinique**, sans règle unique inventée.

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
