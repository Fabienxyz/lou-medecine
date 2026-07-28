---
type: understanding.clinical-reasoning
projects:
  - CR-prescribe-antiplatelet
  - CR-prescribe-heparin
  - CR-prescribe-avk
  - CR-prescribe-aod
  - CR-manage-bleeding
  - CR-manage-tih
provenance:
  source_edition: 2022
  blueprint_revision: phase-4-blueprint
  methodology_version: phase-5-v1
---

# Raisonnement clinique — prescrire et sécuriser les antithrombotiques

## Comment prescrire et adapter les antiagrégants plaquettaires ? {#CR-prescribe-antiplatelet}

Commence par l'aspirine : 75 mg/j en entretien, 300 mg en charge si besoin. En prévention secondaire (coronaropathie, AVC, artériopathie), c'est un traitement à vie sauf complication. {#cb-cr-aap-asp}

Après SCA et/ou stent, prescris une double antiagrégation : aspirine + clopidogrel, prasugrel ou ticagrélor, classiquement 12 mois, modulée par le risque hémorragique (1–12 mois). {#cb-cr-aap-dapt}

Pour les actes invasifs : après stent, retarder les gestes non urgents 6 semaines (stent nu) ou 3–6 mois (stent actif). Pour actes à risque modéré, ne pas arrêter l'aspirine. Si risque hémorragique majeur, arrêt le plus bref possible (5 jours). {#cb-cr-aap-periop}

Pas de surveillance biologique routine de l'activité antiagrégante. {#cb-cr-aap-surveillance}

## Comment prescrire une héparine curative ou préventive ? {#CR-prescribe-heparin}

Choisis la molécule selon l'urgence et la fonction rénale. Si ClCr <30 : HBPM et fondaparinux contre-indiqués — HNF seule avec surveillance TCA. {#cb-cr-hep-choose}

HNF curative : bolus 80 UI/kg puis perfusion 18 UI/kg/h. Premier TCA vers H5, objectif ×2–3 le témoin, adaptation quotidienne. {#cb-cr-hep-hnf}

HBPM curative : 100 U anti-Xa/kg selon le poids — connaître le poids avec précision. Pas de mesure d'activité si prescription correcte et rein normal. {#cb-cr-hep-hbpm}

Indications : TVP/EP, arythmie en attente d'anticoagulant oral, SCA, prophylaxie chirurgicale/médicale. Surveille les plaquettes si traitement prolongé (TIH). {#cb-cr-hep-indic}

## Comment débuter un AVK et gérer le relais héparine ? {#CR-prescribe-avk}

Warfarine (Coumadine®) reste l'AVK de référence. Fluindione : instauration déconseillée ANSM 2017. {#cb-cr-avk-choice}

Instauration : héparine dès J1 en parallèle. Exemple warfarine 5 mg le soir J0–J2 ; 1er INR impératif matin J4 pour adapter J4 soir. {#cb-cr-avk-start}

Arrêt héparine quand : ≥4–5 jours de chevauchement ET 2 INR efficaces à 24 h d'intervalle. INR cible 2–3 ; patient équilibré si ≥70 % dans la cible ; contrôle ≥1×/mois au long cours. {#cb-cr-avk-relay}

Éducation thérapeutique indispensable : interactions, seuils d'alerte INR, prévenir tout médecin du traitement. {#cb-cr-avk-education}

## Comment choisir et adapter un AOD ? {#CR-prescribe-aod}

Avant toute prescription : Cockcroft, poids, âge. CI absolue : valve mécanique, RM serré. Interdit/déconseillé si ClCr <25–30. {#cb-cr-aod-check}

Posologies très variables selon indication (FA, TVP-EP, prophylaxie orthopédique) — se référer au tableau par molécule. Efficacité ~2 h : pas de relais héparine pour TVP/EP/FA établis. {#cb-cr-aod-dose}

Ne pas utiliser INR/TCA pour surveiller l'efficacité — tests perturbés mais non interprétables. Pas de monitoring biologique de routine. {#cb-cr-aod-monitor}

## Comment prendre en charge un saignement sous anticoagulant ? {#CR-manage-bleeding}

**Héparine :** accidents hémorragiques 1–4 % en curatif. Surdosage asymptomatique TCA : adapter doses (tableau 22.5). Accident majeur : protamine IV si HNF. {#cb-cr-bleed-hep}

**AVK :** ~600 000 patients en France ; 1re cause iatrogène d'hospitalisation. Surdosage asymptomatique : conduite selon INR (tableau 22.14) — vitamine K 1–2 mg si INR 6–10. {#cb-cr-bleed-avk-overdose}

Hémorragie grave AVK : arrêt AVK, CCP (PPSB) + vitamine K en urgence sans attendre l'INR, transfusion si besoin, geste hémostatique. INR contrôle 30 min post-CCP. {#cb-cr-bleed-avk-severe}

**AOD :** demi-vie courte — le temps depuis la dernière prise est le premier « antidote ». Dabigatran : idarucizumab. Anti-Xa : PPSB ou Feiba®. Dosage spécifique possible mais ne pas attendre en urgence hémorragique. {#cb-cr-bleed-aod}

## Comment suspecter et traiter une thrombopénie induite par l'héparine ? {#CR-manage-tih}

Deux types : type I bénigne précoce non immune vs type II immune (TIH) vers J5–10. **Le risque TIH est thrombotique, pas hémorragique** — thromboses veineuses/artérielles paradoxales. {#cb-cr-tih-def}

Évoquer devant : plaquettes <100 G/L et/ou chute 30–50 % sous héparine, thrombose sous traitement, résistance à l'HNF. Score 4T pour estimer la probabilité. {#cb-cr-tih-dx}

Conduite : arrêt immédiat de toute héparine (y compris flushs cathéters) dès forte suspicion — ne pas attendre la biologie. Remplacer par danaparoïde (Orgaran®), fondaparinux ou AOD. Carte TIH au patient. {#cb-cr-tih-mgmt}

<!-- claim-trace
claims:
  - id: cb-cr-aap-asp
    class: sourced
    element: CR-prescribe-antiplatelet
    kp: [KP-004, KP-005]
  - id: cb-cr-aap-dapt
    class: sourced
    element: CR-prescribe-antiplatelet
    kp: [KP-014, KP-052]
  - id: cb-cr-aap-periop
    class: sourced
    element: CR-prescribe-antiplatelet
    kp: [KP-008, KP-009]
  - id: cb-cr-aap-surveillance
    class: sourced
    element: CR-prescribe-antiplatelet
    kp: [KP-006, KP-015]
  - id: cb-cr-hep-choose
    class: sourced
    element: CR-prescribe-heparin
    kp: [KP-019, KP-054]
  - id: cb-cr-hep-hnf
    class: sourced
    element: CR-prescribe-heparin
    kp: [KP-021, KP-022]
  - id: cb-cr-hep-hbpm
    class: sourced
    element: CR-prescribe-heparin
    kp: [KP-023]
  - id: cb-cr-hep-indic
    class: sourced
    element: CR-prescribe-heparin
    kp: [KP-024]
  - id: cb-cr-avk-choice
    class: sourced
    element: CR-prescribe-avk
    kp: [KP-027]
  - id: cb-cr-avk-start
    class: sourced
    element: CR-prescribe-avk
    kp: [KP-032]
  - id: cb-cr-avk-relay
    class: sourced
    element: CR-prescribe-avk
    kp: [KP-029, KP-030]
  - id: cb-cr-avk-education
    class: sourced
    element: CR-prescribe-avk
    kp: [KP-053]
  - id: cb-cr-aod-check
    class: sourced
    element: CR-prescribe-aod
    kp: [KP-036, KP-039, KP-054]
  - id: cb-cr-aod-dose
    class: sourced
    element: CR-prescribe-aod
    kp: [KP-037, KP-040]
  - id: cb-cr-aod-monitor
    class: sourced
    element: CR-prescribe-aod
    kp: [KP-038]
  - id: cb-cr-bleed-hep
    class: sourced
    element: CR-manage-bleeding
    kp: [KP-045, KP-020]
  - id: cb-cr-bleed-avk-overdose
    class: sourced
    element: CR-manage-bleeding
    kp: [KP-048, KP-049]
  - id: cb-cr-bleed-avk-severe
    class: sourced
    element: CR-manage-bleeding
    kp: [KP-050]
  - id: cb-cr-bleed-aod
    class: sourced
    element: CR-manage-bleeding
    kp: [KP-051]
  - id: cb-cr-tih-def
    class: sourced
    element: CR-manage-tih
    kp: [KP-046]
  - id: cb-cr-tih-dx
    class: sourced
    element: CR-manage-tih
    kp: [KP-047]
  - id: cb-cr-tih-mgmt
    class: sourced
    element: CR-manage-tih
    kp: [KP-047, KP-026]
-->
