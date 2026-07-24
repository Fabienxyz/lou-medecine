---
chapter: cardio/234
slice: oap-mechanism-vertical-slice
revision: r1
sequence: [MEC-congestion, MEC-oap]
mechanisms:
  - id: MEC-congestion
    question: "Pourquoi la congestion pulmonaire apparaît-elle quand le VG dysfonctionne ?"
    steps:
      - "dysfonctionnement VG → pression télédiastolique ↑"
      - "transmission OG → veines pulmonaires → capillaires pulmonaires"
      - "congestion pulmonaire / pression capillaire ↑"
    uses_kp: [KP-040]

  - id: MEC-oap
    question: "Comment la congestion pulmonaire mène-t-elle à l'OAP ?"
    steps:
      - "pression capillaire pulmonaire ↑ (suite de MEC-congestion)"
      - "franchissement du seuil PPC > 25 mmHg"
      - "passage transsudat → alvéoles"
      - "œdème aigu pulmonaire cardiogénique"
    uses_kp: [KP-041]
    confusion: [CONF-transsudat-exsudat]
    visual_intent: process-flow

confusion:
  - id: CONF-transsudat-exsudat
    a: "OAP cardiogénique = transsudat (pression hydrostatique)"
    b: "OAP lésionnel = exsudat (membrane alvéolo-capillaire lésée)"
    uses_kp: [KP-041, KP-042]
---

## MEC-congestion

Augmentation des pressions de remplissage transmises en amont du VG vers la circulation pulmonaire.

## MEC-oap

Franchissement d'un seuil de pression capillaire pulmonaire entraînant un transsudat alvéolaire — OAP cardiogénique — à distinguer de l'exsudat lésionnel.
