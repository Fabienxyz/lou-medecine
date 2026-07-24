---
type: understanding.clinical-reasoning
projects:
  - CR-recognize
  - CR-diagnose
  - CR-etiology
  - CR-acute
  - CONF-bb-chronic-vs-acute
  - CR-treat-hfref
  - CR-treat-hfpef
  - CONF-ccb-fe-source
  - CR-followup
provenance:
  source_edition: 2024-SFC
  blueprint_revision: phase-4-blueprint
  methodology_version: phase-5-v1
---

# Raisonnement clinique — penser un patient Item 234

Ici : **logique de décision**, pas protocole exhaustif ni doses.

Séparations utiles :
**reconnaître → confirmer → phénotyper → chercher la cause → graduer la gravité → traiter selon le contexte**.

---

## Devant quels symptômes et signes dois-je penser à une IC ? {#CR-recognize}

### Si…

| Finding | Alors… |
|---|---|
| Dyspnée d’effort | penses IC, mais peu spécifique → grade NYHA {#cb-cr-nyha} |
| Orthopnée / DPN | plus spécifiques (redistribution / ↑ pression capillaire) {#cb-cr-orthopnee} |
| Asthme cardiaque, toux, hémoptysies | signes trompeurs possibles d’HTP veineuse {#cb-cr-trompeurs} |
| Dyspnée aiguë de repos, expectoration mousseuse | OAP comme manifestation extrême {#cb-cr-oap-clin} |
| Fatigue, œdèmes, hépatalgie | élargis le tableau congestion / bas débit {#cb-cr-autres} |
| Formes sévères / terminales | SAS/Cheyne-Stokes, confusion, troubles digestifs — marqueurs de gravité {#cb-cr-severe} |
| Signes physiques pauvres sous traitement | n’élimine pas ; leur présence traduit souvent une gravité {#cb-cr-signes} |

### Cadre

Le diagnostic est **difficile** : symptômes non spécifiques, signes peu sensibles ; une dysfonction peut précéder les symptômes. Prévalence ≈ 1–2 % ; âge moyen au diagnostic 75–80 ans. {#cb-cr-cadre}

Cherche aussi les signes cardiaques / pulmonaires / de congestion droite et le niveau de PA (PAS basse = gravité ; OAP hypertensif possible). {#cb-cr-physique}

---

## Comment confirmer ou infirmer une IC ? {#CR-diagnose}

### Chaîne décisionnelle (hors urgence)

1. **Suspicion clinique** (± FDR, ECG anormal)
2. **BNP / NT-proBNP** — libérés à l’étirement myocytaire ; **bonne VPN** {#cb-cr-np-role}
3. Si non rule-out → **échocardiographie (+ Doppler)** = examen clé indispensable {#cb-cr-ett}
4. Typer par FEVG et chercher la cause

### IF / THEN utiles

| Si… | Alors… |
|---|---|
| Dyspnée aiguë + BNP < 100 pg/mL ou NT-proBNP < 300 pg/mL | IC très improbable (rule-out aigu) {#cb-cr-np-acute} |
| Hors urgence + NP bas (seuils ESC rule-out) | IC improbable → autre piste {#cb-cr-np-chronic} |
| Zone grise / facteurs confondants (âge, IR, FA ↑ ; obésité ↓) | reviens à la clinique {#cb-cr-np-confound} |
| ECG normal ou non | ECG **peu contributif au diagnostic positif** ; BBG/QRS importants pour la thérapeutique {#cb-cr-ecg} |
| Radio sans cardiomégalie | n’exclut pas l’IC (notamment FE préservée) ; cherche la sémiologie de stase {#cb-cr-radio} |

Algorithme ESC 2021 hors urgence : doser NP si FDR + symptômes/signes ou ECG anormal → si non rule-out → écho et typage FEVG. {#cb-cr-esc}

---

## Quelle est la cause (ou le facteur aggravant) ? {#CR-etiology}

### Règle

Cherche une cause **traitable / réversible en parallèle** du syndrome — pas après coup seulement. {#cb-cr-eti-rule}

### Ordre de pensée

| Piste | Réflexe |
|---|---|
| Ischémie | 1re cause ; coronarographie si FEVG diminuée selon contexte {#cb-cr-ischemie} |
| HTA | cofacteur majeur (diastolique/HVG, coronaire, postcharge) {#cb-cr-hta} |
| Myocarde | CMD, restrictives/amylose, CMH… {#cb-cr-myocarde} |
| Valves | toute valvulopathie gauche peut basculer en IC {#cb-cr-valves} |
| Rythme / conduction | cause ou déclencheur ; tachycardiomyopathie parfois réversible {#cb-cr-rythme} |
| Péricarde | épanchement, tamponnade, constrictive {#cb-cr-pericar} |
| IC droite | le plus souvent secondaire à l’IC gauche ; causes isolées possibles {#cb-cr-droite} |

Prévention / traitement étiologique : FDR, HTA, valves, reperfusion, toxiques, rythme… {#cb-cr-prev}

---

## Face à une décompensation aiguë, quel triage ? {#CR-acute}

### Définir

IC aiguë = apparition **rapide** (de novo ou aggravation) ; souvent IV / hospitalisation. {#cb-cr-acute-def}

### Axes de triage

```
Congestion dominante ?          Hypoperfusion / PAS basse ?
        │                                    │
        ├─ OAP cardiogénique                 └─ choc cardiogénique
        │   (urgence alvéolaire)                 → inotropes / assistance
        └─ poussée globale sans OAP franc
            → diurétiques IV, cause, rééquilibrage
```

{#cb-cr-triage}

### IF / THEN

| Si… | Alors… |
|---|---|
| OAP | urgence de congestion alvéolaire ; ne retarde pas le traitement pour le bilan {#cb-cr-oap-urg} |
| Dyspnée aiguë | différentiels : pneumopathie, EP, BPCO, asthme {#cb-cr-dd} |
| Facteur déclenchant ? | cherche activement ; mnémonique **CHAMPIT** {#cb-cr-champit} |
| SCA associé | prise en charge **simultanée** {#cb-cr-sca} |
| OAP au domicile / hôpital | position, diurétique, nitrés selon PA, O₂ ; **pas d’introduction de BB** {#cb-cr-oap-tt} |
| Poussée globale sans OAP franc | diurétiques IV, rééquilibrage, cause ; hospitalisation non systématique {#cb-cr-globale} |
| Choc cardiogénique | hypoperfusion / PAS basse → inotropes / assistance {#cb-cr-choc} |

### À ne pas confondre — bêtabloquants {#CONF-bb-chronic-vs-acute}

| Contexte | Règle College (ne pas fusionner) |
|---|---|
| Chronique / hospitalisation pour décompensation (**hors** OAP VII.A) | généralement **poursuivre** le BB sauf échec de réponse ou choc {#cb-conf-bb-chronic} |
| OAP aigu (VII.A) | **ne pas introduire** de BB ; si déjà sous BB → généralement **arrêt ou ↓** posologie {#cb-conf-bb-acute} |

Il n’existe **pas** de règle unique « toujours continuer » ou « toujours arrêter ».

---

## Comment traiter l’IC chronique à FE diminuée (et HFmrEF) ? {#CR-treat-hfref}

### Cadre

État chronique = **hors décompensation aiguë**, traitement oral ambulatoire. {#cb-cr-chronic-def}

### Logique

1. **Mesures générales** : hyposodé prudent, poids, alcool/tabac, activité hors décompensation, vaccinations {#cb-cr-mesures}
2. **Quatre classes** réduisant mortalité/décompensations si FE ≤ 40 % + diurétique de congestion {#cb-cr-quatre}
   - bloqueurs du SRA (IEC ; ARA2 si intolérance ; ARNI selon place)
   - bêtabloquants validés
   - antagonistes minéralocorticoïdes
   - gliflozines
3. **HFmrEF** : mêmes traitements possibles, niveau de preuve moindre {#cb-cr-hmref}
4. **Contraintes** : amiodarone si antiarythmique nécessaire ; CRT / DAI selon critères {#cb-cr-devices}

### Médicaments à risque en IC systolique

Contre-indiqués / à éviter notamment : **diltiazem et vérapamil**, flécaïnide, AINS. Les **dihydropyridines** restent utilisables si indication associée (angor, HTA). {#cb-cr-ci-syst}

---

## Comment raisonner l’IC à FE préservée ? {#CR-treat-hfpef}

### Diagnostic (cluster)

Symptômes/signes + FE ≥ 50 % + NP ↑ + arguments de remplissage / HVG / AG. {#cb-cr-hfpef-dx}

### Traitement

Peu codifié : **éviter les déclencheurs** (HTA, FA, surcharge) ; **gliflozines** récemment efficaces ; logique ABCDEFG. {#cb-cr-hfpef-tt}

Ne pas importer automatiquement toutes les règles de l’IC systolique.

### À ne pas confondre — inhibiteurs calciques / FE {#CONF-ccb-fe-source}

La source College **n’est pas uniforme** sur ce point. Ne pas inventer une règle universelle.

| Ancrage distinct | Contenu |
|---|---|
| VI.C.8 (IC systolique) | diltiazem / vérapamil **contre-indiqués** ; dihydropyridines possibles si indication associée {#cb-conf-ccb-syst} |
| VI.F ABCDEFG (HFpEF) | un inhibiteur calcique **ralentisseur** peut entrer dans la logique de baisse de FC {#cb-conf-ccb-hfpef} |
| « Notions inacceptables » | libellé conflictuel sur FE préservée — **conflit de source non résolu** {#cb-conf-ccb-ambig} |

En pratique pédagogique : ancre le raisonnement au **contexte FE + section**, et signale l’ambiguïté plutôt que de la lisser.

---

## Que surveiller après stabilisation ? {#CR-followup}

| Question | Réflexe |
|---|---|
| Histoire naturelle ? | dysfonction asymptomatique → IC ; oscillations stabilité / décompensations {#cb-cr-hn} |
| Pronostic ? | mortalité et hospitalisations élevées ; mort subite ou IC réfractaire {#cb-cr-progn} |
| Complications / comorbidités ? | les prendre en charge (elles freinent traitement et survie) {#cb-cr-comorb} |
| Après hospitalisation ? | éducation, réadaptation, soins de support {#cb-cr-parcours} |
| Comment dépister tôt ? | télésurveillance PA / FC / poids {#cb-cr-tele} |

<!-- claim-trace
claims:
  - id: cb-cr-nyha
    class: sourced
    element: CR-recognize
    kp: [KP-019]
  - id: cb-cr-orthopnee
    class: sourced
    element: CR-recognize
    kp: [KP-020]
  - id: cb-cr-trompeurs
    class: sourced
    element: CR-recognize
    kp: [KP-021]
  - id: cb-cr-oap-clin
    class: sourced
    element: CR-recognize
    kp: [KP-022]
  - id: cb-cr-autres
    class: sourced
    element: CR-recognize
    kp: [KP-023, KP-025]
  - id: cb-cr-severe
    class: sourced
    element: CR-recognize
    kp: [KP-024]
  - id: cb-cr-signes
    class: sourced
    element: CR-recognize
    kp: [KP-026]
  - id: cb-cr-cadre
    class: sourced
    element: CR-recognize
    kp: [KP-003, KP-004]
  - id: cb-cr-physique
    class: sourced
    element: CR-recognize
    kp: [KP-027, KP-028, KP-029, KP-030]
  - id: cb-cr-np-role
    class: sourced
    element: CR-diagnose
    kp: [KP-035]
  - id: cb-cr-ett
    class: sourced
    element: CR-diagnose
    kp: [KP-039]
  - id: cb-cr-np-acute
    class: sourced
    element: CR-diagnose
    kp: [KP-036]
  - id: cb-cr-np-chronic
    class: sourced
    element: CR-diagnose
    kp: [KP-043]
  - id: cb-cr-np-confound
    class: sourced
    element: CR-diagnose
    kp: [KP-038]
  - id: cb-cr-ecg
    class: sourced
    element: CR-diagnose
    kp: [KP-032]
  - id: cb-cr-radio
    class: sourced
    element: CR-diagnose
    kp: [KP-033, KP-034]
  - id: cb-cr-esc
    class: sourced
    element: CR-diagnose
    kp: [KP-043]
  - id: cb-cr-eti-rule
    class: sourced
    element: CR-etiology
    kp: [KP-073]
  - id: cb-cr-ischemie
    class: sourced
    element: CR-etiology
    kp: [KP-045, KP-050]
  - id: cb-cr-hta
    class: sourced
    element: CR-etiology
    kp: [KP-051]
  - id: cb-cr-myocarde
    class: sourced
    element: CR-etiology
    kp: [KP-052, KP-053, KP-072]
  - id: cb-cr-valves
    class: sourced
    element: CR-etiology
    kp: [KP-054]
  - id: cb-cr-rythme
    class: sourced
    element: CR-etiology
    kp: [KP-055]
  - id: cb-cr-pericar
    class: sourced
    element: CR-etiology
    kp: [KP-056]
  - id: cb-cr-droite
    class: sourced
    element: CR-etiology
    kp: [KP-057]
  - id: cb-cr-prev
    class: sourced
    element: CR-etiology
    kp: [KP-073]
  - id: cb-cr-acute-def
    class: sourced
    element: CR-acute
    kp: [KP-059]
  - id: cb-cr-triage
    class: sourced
    element: CR-acute
    kp: [KP-060, KP-063, KP-104]
  - id: cb-cr-oap-urg
    class: sourced
    element: CR-acute
    kp: [KP-060]
  - id: cb-cr-dd
    class: sourced
    element: CR-acute
    kp: [KP-061]
  - id: cb-cr-champit
    class: sourced
    element: CR-acute
    kp: [KP-106, KP-062]
  - id: cb-cr-sca
    class: sourced
    element: CR-acute
    kp: [KP-109]
  - id: cb-cr-oap-tt
    class: sourced
    element: CR-acute
    kp: [KP-099, KP-100, KP-103]
  - id: cb-cr-globale
    class: sourced
    element: CR-acute
    kp: [KP-104]
  - id: cb-cr-choc
    class: sourced
    element: CR-acute
    kp: [KP-063, KP-105]
  - id: cb-conf-bb-chronic
    class: sourced
    element: CONF-bb-chronic-vs-acute
    kp: [KP-081]
  - id: cb-conf-bb-acute
    class: sourced
    element: CONF-bb-chronic-vs-acute
    kp: [KP-103]
  - id: cb-cr-chronic-def
    class: sourced
    element: CR-treat-hfref
    kp: [KP-064]
  - id: cb-cr-mesures
    class: sourced
    element: CR-treat-hfref
    kp: [KP-074, KP-075, KP-076]
  - id: cb-cr-quatre
    class: sourced
    element: CR-treat-hfref
    kp: [KP-077, KP-078, KP-079, KP-080, KP-081, KP-082, KP-083, KP-084]
  - id: cb-cr-hmref
    class: sourced
    element: CR-treat-hfref
    kp: [KP-085]
  - id: cb-cr-devices
    class: sourced
    element: CR-treat-hfref
    kp: [KP-087, KP-091, KP-092]
  - id: cb-cr-ci-syst
    class: sourced
    element: CR-treat-hfref
    kp: [KP-089, KP-090]
  - id: cb-cr-hfpef-dx
    class: sourced
    element: CR-treat-hfpef
    kp: [KP-065]
  - id: cb-cr-hfpef-tt
    class: sourced
    element: CR-treat-hfpef
    kp: [KP-096]
  - id: cb-conf-ccb-syst
    class: sourced
    element: CONF-ccb-fe-source
    kp: [KP-089, KP-090]
  - id: cb-conf-ccb-hfpef
    class: sourced
    element: CONF-ccb-fe-source
    kp: [KP-096]
  - id: cb-conf-ccb-ambig
    class: sourced
    element: CONF-ccb-fe-source
    kp: [KP-089, KP-096]
  - id: cb-cr-hn
    class: sourced
    element: CR-followup
    kp: [KP-066]
  - id: cb-cr-progn
    class: sourced
    element: CR-followup
    kp: [KP-067, KP-068]
  - id: cb-cr-comorb
    class: sourced
    element: CR-followup
    kp: [KP-069, KP-071]
  - id: cb-cr-parcours
    class: sourced
    element: CR-followup
    kp: [KP-097]
  - id: cb-cr-tele
    class: sourced
    element: CR-followup
    kp: [KP-098]
-->
