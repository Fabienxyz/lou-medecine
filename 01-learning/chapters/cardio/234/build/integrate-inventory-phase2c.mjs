#!/usr/bin/env node
/**
 * Phase 2C — integrate ratified candidate inventory into canonical inventory.yaml
 * Run from repo root: node 01-learning/chapters/cardio/234/build/integrate-inventory-phase2c.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "../../../../../tools/lou-build/node_modules/yaml/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAPTER = path.resolve(__dirname, "..");
const REPO = path.resolve(__dirname, "../../../../../");
const SOURCE = path.join(
  REPO,
  "01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md"
);
const CAND_PATH = path.join(__dirname, "inventory-candidate.yaml");

const sourceText = fs.readFileSync(SOURCE, "utf8");
const candidate = YAML.parse(fs.readFileSync(CAND_PATH, "utf8"));
const byId = new Map(candidate.kps.map((k) => [k.id, k]));

function cand(id) {
  const k = byId.get(id);
  if (!k) throw new Error(`missing ${id}`);
  return structuredClone(k);
}

function stripMeta(kp) {
  delete kp.section;
  delete kp.rank_note;
  delete kp.note;
  delete kp.exclusion_reason;
  delete kp.candidate_status;
  return kp;
}

function kpBase(from, overrides = {}) {
  const k = stripMeta(structuredClone(from));
  Object.assign(k, overrides);
  return k;
}

/** Build ratified semantic units in source/chapter order */
function buildRatifiedUnits() {
  const units = [];

  const keep = (id, overrides = {}) => {
    units.push({ candidate_id: id, action: overrides._action || "kept", ...kpBase(cand(id), overrides) });
  };

  const split = (id, parts) => {
    for (const part of parts) {
      units.push({
        candidate_id: id,
        action: "split",
        ...kpBase(cand(id), part),
      });
    }
  };

  const add = (spec) => {
    units.push({ candidate_id: null, action: "added", ...spec });
  };

  keep("CAND-001");
  keep("CAND-002");
  keep("CAND-003");
  keep("CAND-004");
  keep("CAND-005");
  keep("CAND-006");
  keep("KP-040", { _action: "kept" });
  keep("CAND-007");
  keep("KP-041", { _action: "kept" });
  keep("KP-042", { _action: "kept" });
  keep("CAND-008");
  keep("CAND-009", {
    _action: "enriched",
    label:
      "Remodelage : dilatation/hypertrophie excentrique et hypertrophie concentrique (loi de Laplace) ; exemple VTD 100→200 mL / FE 60→30 % / VES 60 mL conservé ; compensation puis effets délétères",
    anchors: [
      ...cand("CAND-009").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "I. Généralités > C Physiopathologie > 2 En cas de dysfonctionnement cardiaque",
        quote:
          "si un volume télédiastolique passe de 100 à 200 mL lorsque la fraction d’éjection ventriculaire gauche chute de 60 à 30 %, on s’aperçoit que le volume d’éjection ventriculaire reste conservé à 60 mL",
      },
    ],
  });

  split("CAND-010", [
    {
      label:
        "Loi de Starling : étirement des fibres (précharge) → ↑ inotropie jusqu’à une limite de dilatation",
      anchors: [
        {
          edition: "2024-SFC",
          section_path:
            "I. Généralités > C Physiopathologie > 2 En cas de dysfonctionnement cardiaque",
          quote: "D’après la loi de Starling, l’étirement des fibres",
        },
        {
          edition: "2024-SFC",
          section_path:
            "I. Généralités > C Physiopathologie > 2 En cas de dysfonctionnement cardiaque",
          quote:
            "s’accompagne d’une augmentation de l’inotropie du ventricule jusqu’à une certaine limite de dilatation",
        },
      ],
    },
    {
      label:
        "Tachycardie compensatrice sympathique maintenant le DC ; effets délétères (travail cardiaque, consommation en O₂)",
      anchors: [
        {
          edition: "2024-SFC",
          section_path:
            "I. Généralités > C Physiopathologie > 2 En cas de dysfonctionnement cardiaque",
          quote:
            "La tachycardie, sous la dépendance de l’activation du système sympathique, contribue également à maintenir le débit cardiaque",
        },
        {
          edition: "2024-SFC",
          section_path:
            "I. Généralités > C Physiopathologie > 2 En cas de dysfonctionnement cardiaque",
          quote:
            "L’effet délétère est une augmentation du travail cardiaque et de la consommation en oxygène du cœur",
        },
      ],
    },
  ]);

  keep("CAND-011", {
    _action: "enriched",
    label:
      "Compensations extra-cardiaques : vasoconstriction inhomogène, rétention hydrosodée, activation neurohormonale (sympathique + SRAA) avec effets délétères (travail cardiaque, proarythmie, toxicité catécholamines)",
    anchors: [
      ...cand("CAND-011").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "I. Généralités > C Physiopathologie > 2 En cas de dysfonctionnement cardiaque",
          quote:
            "Les effets délétères sont une augmentation du travail cardiaque, des effets proarythmiques, des effets toxiques directs des catécholamines sur les myocytes",
      },
    ],
  });

  for (const id of [
    "CAND-012",
    "CAND-013",
    "CAND-014",
    "CAND-015",
    "CAND-016",
    "CAND-017",
    "CAND-018",
    "CAND-019",
    "CAND-020",
    "CAND-021",
  ]) {
    keep(id);
  }

  split("CAND-022", [
    {
      label:
        "Autres symptômes d’IC : fatigue, prise de poids/œdèmes, faiblesse musculaire, palpitations",
      anchors: [
        {
          edition: "2024-SFC",
          section_path: "II. Diagnostic > A Signes fonctionnels > 2 Autres symptômes",
          quote: "d’une fatigue de repos liée à l’hypotension artérielle ou à l’effort",
        },
        {
          edition: "2024-SFC",
          section_path: "II. Diagnostic > A Signes fonctionnels > 2 Autres symptômes",
          quote: "d’une prise de poids associée à des œdèmes",
        },
      ],
    },
    {
      label:
        "Manifestations d’IC sévère/terminale : SAS/Cheyne-Stokes, confusion, troubles digestifs",
      anchors: [
        {
          edition: "2024-SFC",
          section_path: "II. Diagnostic > A Signes fonctionnels > 2 Autres symptômes",
          quote: "La prévalence du syndrome d’apnées du sommeil est augmentée dans l’IC",
        },
        {
          edition: "2024-SFC",
          section_path: "II. Diagnostic > A Signes fonctionnels > 2 Autres symptômes",
          quote: "des troubles digestifs (douleurs abdominales, nausées, vomissements)",
        },
      ],
    },
  ]);

  for (const id of [
    "CAND-023",
    "CAND-024",
    "CAND-025",
    "CAND-026",
    "CAND-027",
    "CAND-028",
    "CAND-029",
    "CAND-030",
  ]) {
    keep(id);
  }

  keep("CAND-031", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-031").anchors,
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > D Radiographie thoracique",
        quote: "des formes unilatérales trompeuses peuvent se voir",
      },
    ],
  });

  keep("CAND-032", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-032").anchors,
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > D Radiographie thoracique",
        quote: "des formes unilatérales trompeuses peuvent se voir",
      },
    ],
  });

  for (const id of ["CAND-033", "CAND-034", "CAND-036", "CAND-037", "CAND-038"]) {
    keep(id);
  }

  keep("CAND-035", {
    _action: "enriched",
    label:
      "Algorithme diagnostique ESC 2021 hors urgence : rule-out BNP < 35 pg/mL / NT-proBNP < 125 pg/mL ; si ≥ ou forte suspicion → échocardiographie et typage par FEVG",
    anchors: cand("CAND-035").anchors,
  });

  keep("CAND-039");

  keep("CAND-040", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-040").anchors,
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > H Autres examens complémentaires",
        quote:
          "en cas de FEVG basse, la normalité du réseau coronarien et l’absence d’autres causes orientent vers une cardiomyopathie dilatée",
      },
    ],
  });

  keep("CAND-041");
  keep("CAND-042");

  add({
    label:
      "Scintigraphie isotopique : mesure FE (patients non échogènes, rarement) ; évaluation ischémie / viabilité",
    section: "II. Diagnostic > H Autres examens complémentaires",
    rank: "unknown",
    disposition: "deferred-to-mastery",
    anchors: [
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > H Autres examens complémentaires",
        quote: "La scintigraphie isotopique peut d’une part aider à la mesure de la FE ventriculaire gauche",
      },
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > H Autres examens complémentaires",
        quote: "évaluer la présence d’une ischémie myocardique ou d’une viabilité",
      },
    ],
  });

  keep("CAND-043", {
    _action: "enriched",
    label:
      "Cathétérisme droit : pressions/débit ; valeurs normales (OD < 5 mmHg, VD 25/0, PCAP/PAPO < 15 mmHg, DC 5 L/min, index 3 L/min/m²) ; HTAP PAPm > 25 mmHg ; RAP > 5 UW CI greffe",
    anchors: [
      ...cand("CAND-043").anchors,
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > H Autres examens complémentaires",
        quote: "Il permet de mesurer la pression dans l’atrium droit (normale < 5 mmHg)",
      },
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > H Autres examens complémentaires",
        quote: "dans le ventricule droit (normale 25/0 mmHg)",
      },
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > H Autres examens complémentaires",
        quote: "PCAP ou PAPO [pression artérielle pulmonaire d’occlusion] < 15 mmHg",
      },
      {
        edition: "2024-SFC",
        section_path: "II. Diagnostic > H Autres examens complémentaires",
        quote: "le débit cardiaque normal est de 5 L/min, l’index cardiaque de 3 L/min/m2",
      },
    ],
  });

  for (const id of [
    "CAND-044",
    "CAND-045",
    "CAND-046",
    "CAND-048",
    "CAND-049",
    "CAND-050",
    "CAND-051",
    "CAND-052",
    "CAND-053",
    "CAND-054",
    "CAND-055",
    "CAND-056",
    "CAND-057",
    "CAND-058",
    "CAND-059",
    "CAND-060",
    "CAND-061",
    "CAND-062",
    "CAND-063",
    "CAND-064",
    "CAND-065",
    "CAND-066",
  ]) {
    keep(id);
  }

  keep("CAND-047", {
    _action: "enriched",
    label:
      "CMH : hypertrophie souvent asymétrique du SIV, FE conservée, trouble du remplissage ; forme obstructive possible ; familiale sarcomérique ; maladie de Fabry ; risque de mort subite (athlète jeune)",
    anchors: [
      ...cand("CAND-047").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "III. Diagnostic étiologique > C Cardiomyopathies > 2 Cardiomyopathies hypertrophiques (CMH)",
        quote: "maladie de Fabry = maladie génétique liée à un déficit de l’enzyme",
      },
    ],
  });

  keep("CAND-067", {
    _action: "enriched",
    anchors: [
      cand("CAND-067").anchors[0],
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > A Traitement étiologique et préventif",
        quote: "de traiter les facteurs de risque cardiovasculaire (statines chez les patients à haut risque",
      },
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > A Traitement étiologique et préventif",
        quote: "la prévention de l’obésité, de la sédentarité",
      },
    ],
  });

  for (const id of ["CAND-068", "CAND-069"]) keep(id);

  keep("CAND-070", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-070").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > B Mesures hygiénodiététiques > 5 Travail et réinsertion professionnelle",
        quote: "Dans l’IC avérée, la poursuite d’une activité professionnelle nécessitant des efforts physiques importants",
      },
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > B Mesures hygiénodiététiques > 5 Travail et réinsertion professionnelle",
        quote: "une demande d’invalidité doit être envisagée",
      },
    ],
  });

  keep("CAND-071");
  keep("CAND-072");

  split("CAND-073", [
    {
      label: "ARA2 : alternative si intolérance aux IEC (moins de toux)",
      anchors: [
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > C > 1 Bloqueurs du système rénine – angiotensine (SRA)",
          quote: "on les réserve aux patients intolérants aux IEC",
        },
      ],
    },
    {
      label:
        "Sacubitril/valsartan (ARNI) : supérieur à énalapril ; remplacement IEC/ARA2 si restant symptomatique sous traitement optimal",
      anchors: [
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > C > 1 Bloqueurs du système rénine – angiotensine (SRA)",
          quote:
            "Indiqué en remplacement des IEC (ou des ARA2) chez les patients restant symptomatiques malgré un traitement conventionnel optimal",
        },
      ],
    },
  ]);

  keep("CAND-074");

  keep("CAND-075", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-075").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > C > 3 Antialdostérones ou antagonistes des récepteurs aux minéralocorticoïdes (spironolactone et éplérénone)",
        quote: "l’adjonction d’éplérénone au traitement conventionnel (BASIC",
      },
    ],
  });

  keep("CAND-076", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-076").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > C > 4 Inhibiteurs du transporteur sodium glucose de type 2 (SGLT2) ou gliflozines",
        quote: "s’accompagnent sur le long terme plutôt d’un effet protecteur rénal",
      },
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > C > 4 Inhibiteurs du transporteur sodium glucose de type 2 (SGLT2) ou gliflozines",
        quote: "Les effets secondaires sont peu fréquents : infections génitales, acidocétose",
      },
    ],
  });

  for (const id of ["CAND-077", "CAND-078", "CAND-079"]) keep(id);

  split("CAND-080", [
    {
      label: "Amiodarone : seul antiarythmique utilisable si FEVG diminuée",
      disposition: "understanding",
      anchors: [
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > C > 7 Autres traitements parfois associés",
          quote:
            "C’est le seul antiarythmique que l’on peut prescrire chez l’insuffisant cardiaque à FEVG diminuée",
        },
      ],
    },
    {
      label:
        "Antiagrégants / anticoagulants dans l’IC (aspirine, DAPT, AOD, CHA₂DS₂-VASc, HAS-BLED, thrombus, AVC embolique)",
      disposition: "deferred-to-mastery",
      anchors: [
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > C > 7 Autres traitements parfois associés",
          quote: "on privilégie les anticoagulants oraux directs",
        },
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > C > 7 Autres traitements parfois associés",
          quote: "Il est recommandé de calculer, pour l’évaluation du risque embolique, le score CHA2DS2-VASc",
        },
      ],
    },
  ]);

  keep("CAND-081", {
    _action: "enriched",
    label:
      "Médicaments contre-indiqués/à éviter dans l’IC systolique : diltiazem et vérapamil ; flécaïnide (classe I) ; AINS (rétention hydrosodée) — source notions inacceptables cite « IC à FE préservée » (voir audit Phase 3)",
    anchors: cand("CAND-081").anchors,
  });

  add({
    label:
      "Dihydropyridines (félodipine, amlodipine) : effet neutre sur la mortalité ; utilisables si indication associée (angor, HTA) — contrast with diltiazem/vérapamil CI in IC systolique",
    section:
      "VI. Traitement de l’insuffisance cardiaque chronique > C > 8. Traitements contre-indiqués",
    rank: "unknown",
    disposition: "understanding",
    anchors: [
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > C > 8. Traitements contre-indiqués",
        quote:
          "Les dihydropyridines (félodipine et amlodipine) ont un effet neutre sur la mortalité",
      },
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > C > 8. Traitements contre-indiqués",
        quote:
          "peuvent donc être prescrites lorsqu’une indication associée est présente (angor, HTA)",
      },
    ],
  });

  keep("CAND-082");

  keep("CAND-083", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-083").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > C > 9 Traitement dit « électrique »",
        quote: "Les complications du DAI sont les infections de sonde et les chocs inappropriés",
      },
    ],
  });

  keep("CAND-084");

  keep("CAND-085", {
    disposition: "deferred-to-mastery",
    _action: "enriched",
  });

  keep("CAND-086");

  keep("CAND-087", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-087").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "VI. Traitement de l’insuffisance cardiaque chronique > F Traitement médicamenteux de l’insuffisance cardiaque à fraction d’éjection conservée",
        quote: "Dans le cadre de l’amylose cardiaque à transthyrétine, un traitement spécifique est",
      },
    ],
  });

  split("CAND-088", [
    {
      label:
        "Parcours de soins post-hospitalisation : risque de réhospitalisation, éducation pluridisciplinaire, IPA/protocole de coopération, réadaptation SSR, soins palliatifs/support",
      anchors: [
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > G Prise en charge globale et parcours de soins",
          quote:
            "Après une première hospitalisation pour IC, le risque de réhospitalisations est important",
        },
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > G Prise en charge globale et parcours de soins",
          quote: "des infirmiers en pratique avancée ou infirmiers ayant suivi une formation au protocole de coopération",
        },
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > G Prise en charge globale et parcours de soins",
          quote: "réaliser une réadaptation à l’effort dans des centres de SSR spécialisés",
        },
      ],
    },
    {
      label:
        "Télésurveillance de l’IC : programmes remboursés ; paramètres PA/FC/poids ; alertes algorithmiques ; dépistage précoce de décompensation",
      anchors: [
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > G Prise en charge globale et parcours de soins",
          quote: "programmes de télésurveillance ont été mis en place et, depuis peu, remboursés",
        },
        {
          edition: "2024-SFC",
          section_path:
            "VI. Traitement de l’insuffisance cardiaque chronique > G Prise en charge globale et parcours de soins",
          quote:
            "surveiller les symptômes des patients et certains paramètres simples (pression artérielle, fréquence cardiaque, poids)",
        },
      ],
    },
  ]);

  keep("CAND-089");

  keep("CAND-090", {
    _action: "enriched",
    anchors: [
      ...cand("CAND-090").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "VII. Traitement de l’insuffisance cardiaque aiguë > A Traitement de l’œdème aigu pulmonaire",
        quote: "utilisation de morphine IV non recommandée sauf en cas d’anxiété importante non contrôlée",
      },
    ],
  });

  add({
    label:
      "OAP hospitalier — déclencheur FA rapide : digoxine IV et anticoagulation efficace",
    section:
      "VII. Traitement de l’insuffisance cardiaque aiguë > A Traitement de l’œdème aigu pulmonaire",
    rank: "unknown",
    disposition: "deferred-to-mastery",
    anchors: [
      {
        edition: "2024-SFC",
        section_path:
          "VII. Traitement de l’insuffisance cardiaque aiguë > A Traitement de l’œdème aigu pulmonaire",
        quote:
          "digoxine IV et anticoagulation efficace en cas de fibrillation atriale rapide",
      },
    ],
  });

  add({
    label:
      "OAP hospitalier — poussée hypertensive : perfusion de nicardipine IV (1 à 5 mg/h)",
    section:
      "VII. Traitement de l’insuffisance cardiaque aiguë > A Traitement de l’œdème aigu pulmonaire",
    rank: "unknown",
    disposition: "deferred-to-mastery",
    anchors: [
      {
        edition: "2024-SFC",
        section_path:
          "VII. Traitement de l’insuffisance cardiaque aiguë > A Traitement de l’œdème aigu pulmonaire",
        quote:
          "traitement d’une poussée hypertensive par perfusion de nicardipine IV (1 à 5 mg/h)",
      },
    ],
  });

  keep("CAND-091", {
    _action: "enriched",
    label:
      "Pendant une poussée : ne pas introduire de bêtabloquant ; si déjà sous bêtabloquant → arrêt ou ↓ posologie ; IEC/ARA2/ARNI après stabilisation",
    anchors: [
      ...cand("CAND-091").anchors,
      {
        edition: "2024-SFC",
        section_path:
          "VII. Traitement de l’insuffisance cardiaque aiguë > A Traitement de l’œdème aigu pulmonaire",
        quote:
          "si le patient est déjà sous bêtabloquant, il est généralement arrêté ou sa posologie est diminuée",
      },
    ],
  });

  for (const id of ["CAND-092", "CAND-093", "CAND-094"]) keep(id);

  keep("CAND-095", {
    exclusion_reason:
      "Curriculum navigation / situational entry points, not examinable medical propositional knowledge for the Inventory",
  });
  keep("CAND-096", {
    exclusion_reason:
      "Cross-item navigation pointers, not medical knowledge units of Item 234",
  });

  return units;
}

const FROZEN = new Set(["KP-040", "KP-041", "KP-042"]);

function allocateIds(units) {
  let n = 1;
  function nextId() {
    while (FROZEN.has(`KP-${String(n).padStart(3, "0")}`)) n += 1;
    const id = `KP-${String(n).padStart(3, "0")}`;
    n += 1;
    return id;
  }

  const mappings = [];
  const kps = [];

  for (const unit of units) {
    const section =
      unit.section ||
      (unit.candidate_id && byId.get(unit.candidate_id)?.section) ||
      null;
    let finalId;
    if (unit.candidate_id === "KP-040") finalId = "KP-040";
    else if (unit.candidate_id === "KP-041") finalId = "KP-041";
    else if (unit.candidate_id === "KP-042") finalId = "KP-042";
    else finalId = nextId();

    const { candidate_id, action, _action, section: _s, id: _provisionalId, ...kpFields } =
      unit;
    const kp = {
      ...kpFields,
      id: finalId,
    };
    if (!kp.rank) kp.rank = "unknown";
    kps.push(kp);

    mappings.push({
      candidate_id: candidate_id || "(added)",
      final_kp_id: finalId,
      action: _action || action,
      source_section: section,
    });
  }

  return { kps, mappings };
}

function validateQuotes(kps) {
  const nw = (t) => t.replace(/\s+/g, " ").trim();
  const ns = nw(sourceText);
  const errors = [];
  for (const kp of kps) {
    for (const a of kp.anchors || []) {
      const q = nw(a.quote || "");
      let count = 0;
      let pos = 0;
      while (true) {
        const i = ns.indexOf(q, pos);
        if (i === -1) break;
        count += 1;
        pos = i + q.length;
      }
      if (count !== 1) {
        errors.push(`${kp.id}: quote resolves ${count}× — ${String(a.quote).slice(0, 70)}`);
      }
    }
  }
  return errors;
}

const units = buildRatifiedUnits();
const { kps, mappings } = allocateIds(units);

const quoteErrors = validateQuotes(kps);
if (quoteErrors.length) {
  console.error("Quote validation failures:");
  for (const e of quoteErrors) console.error(" -", e);
  process.exit(1);
}

const inventory = {
  chapter: "cardio/234",
  source_edition: "2024-SFC",
  inventory_scope: "full-chapter",
  revision: "phase-2c-integrated",
  note:
    "Ratified full Item 234 Knowledge Inventory (Phase 2C). OAP slice build uses subset KP-040/041/042 only. Notions inacceptables FE préservée vs IC systolique wording conflict preserved for Phase 3 — see build/inventory-integration-notes.md.",
  kps,
};

// Preserve editions on frozen OAP slice KPs
for (const id of FROZEN) {
  const kp = kps.find((k) => k.id === id);
  if (kp) {
    kp.editions = [{ edition: "2024-SFC", change: "new" }];
  }
}

const idMap = {
  chapter: "cardio/234",
  phase: "2c-integration",
  source_edition: "2024-SFC",
  frozen_ids: ["KP-040", "KP-041", "KP-042"],
  allocation_strategy:
    "Deterministic source/chapter order walk; KP-040/041/042 preserved at semantic positions; other units receive next sequential KP-NNN skipping reserved 040-042 slots.",
  mappings,
};

fs.writeFileSync(path.join(CHAPTER, "inventory.yaml"), YAML.stringify(inventory));
fs.writeFileSync(
  path.join(__dirname, "inventory-id-map.yaml"),
  YAML.stringify(idMap)
);

const counts = { understanding: 0, "deferred-to-mastery": 0, "excluded-with-justification": 0 };
for (const kp of kps) {
  counts[kp.disposition] = (counts[kp.disposition] || 0) + 1;
}

console.log("Phase 2C integration complete");
console.log(`total_kps=${kps.length}`);
console.log("dispositions:", counts);
