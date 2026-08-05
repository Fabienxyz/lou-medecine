#!/usr/bin/env node
/**
 * Generate VCCK generic fixtures (positive short/long + negative per family).
 * Non-medical domains only: logistics, irrigation, industrial control, library, weather, stock.
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";
import { VCCK_POSITIVE, VCCK_NEGATIVE } from "../lib/vcck/paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE = {
  provenance: {
    source_edition: 2022,
    walkthrough: "VCCK",
    methodology_version: "vcck-0",
  },
  chapter: "vcck/fixtures",
};

function writeYaml(filePath, doc) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, YAML.stringify(doc));
}

function causal(id, question, nodes, edges, extra = {}) {
  return {
    spec_version: "0.1",
    primitive: "causal-graph",
    chapter: BASE.chapter,
    element: `vcck-${id}`,
    question,
    nodes,
    edges,
    ...extra,
  };
}

function decision(id, question, nodes, branches, extra = {}) {
  return {
    spec_version: "0.2",
    primitive: "decision-algorithm",
    variant: "diagnostic",
    technology: "svg",
    chapter: BASE.chapter,
    element: `vcck-${id}`,
    question,
    provenance: BASE.provenance,
    nodes,
    branches,
    annotations: extra.annotations || [
      { id: "ann-note", label: "Note hors flux", placement: "out-of-flow", class: "scaffolding" },
    ],
    ...extra,
  };
}

function threshold(id, question, contexts, extra = {}) {
  return {
    spec_version: "0.2",
    primitive: "threshold-scale",
    variant: "numeric-contextual",
    technology: "svg",
    chapter: BASE.chapter,
    element: `vcck-${id}`,
    question,
    provenance: BASE.provenance,
    contexts,
    interpretations: extra.interpretations || [
      {
        id: "interp-1",
        label: "Une valeur haute ne suffit pas seule",
        attach_to: "not-low-band",
        class: "sourced",
        kp: ["KP-VCK-001"],
      },
    ],
    confounders: extra.confounders || {
      increase: [{ id: "cf-up", label: "Facteur augmentant", class: "sourced", kp: ["KP-VCK-001"] }],
      decrease: [{ id: "cf-down", label: "Facteur diminuant", class: "sourced", kp: ["KP-VCK-002"] }],
    },
    ...extra,
  };
}

function fragmentScale(id, analyte, cutoff, value, unit) {
  return {
    id,
    analyte,
    cutoff_label: cutoff,
    comparator: "<",
    value,
    unit,
    class: "sourced",
    kp: ["KP-VCK-001"],
  };
}
function scale(id, analyte, cutoff, value, unit, labels) {
  return {
    id,
    analyte,
    cutoff_label: cutoff,
    comparator: "<",
    value,
    unit,
    low_band_label: labels.low,
    not_low_band_label: labels.high,
    class: "sourced",
    kp: ["KP-VCK-001"],
  };
}

const S = { class: "scaffolding" };
const K = { class: "sourced", kp: ["KP-VCK-001"] };

const FIXTURES = {
  "chain-short": causal(
    "chain-short",
    "Comment progresse un colis ?",
    [
      { id: "depot", kind: "state", label: "Dépôt central", ...S },
      { id: "hub", kind: "state", label: "Plateforme régionale", ...S },
      { id: "delivery", kind: "event", label: "Livraison locale", ...S },
    ],
    [
      { from: "depot", to: "hub", relation: "causes", ...S },
      { from: "hub", to: "delivery", relation: "causes", ...S },
    ],
  ),

  "chain-long": causal(
    "chain-long",
    "Comment progresse un colis sur le réseau logistique complet ?",
    [
      { id: "depot", kind: "state", label: "Dépôt central saturé", ...S },
      { id: "hub", kind: "state", label: "Plateforme régionale triée", ...S },
      { id: "route", kind: "response", label: "Camion affecté tôt", ...S },
      { id: "delivery", kind: "event", label: "Livraison locale confirmée", ...S },
    ],
    [
      { from: "depot", to: "hub", relation: "causes", ...S },
      { from: "hub", to: "route", relation: "causes", ...S },
      { from: "route", to: "delivery", relation: "causes", ...S },
    ],
  ),

  "fan-out-short": causal(
    "fan-out-short",
    "Que déclenche une vanne ouverte ?",
    [
      { id: "valve", kind: "state", label: "Vanne ouverte", ...S },
      { id: "flow-a", kind: "response", label: "Débit canal A", ...S },
      { id: "flow-b", kind: "response", label: "Débit canal B", ...S },
    ],
    [
      { from: "valve", to: "flow-a", relation: "causes", ...S },
      { from: "valve", to: "flow-b", relation: "causes", ...S },
    ],
  ),

  "fan-out-long": causal(
    "fan-out-long",
    "Que déclenche une vanne principale ouverte sur l'irrigation ?",
    [
      { id: "valve", kind: "state", label: "Vanne principale ouverte", ...S },
      { id: "flow-a", kind: "response", label: "Débit canal nord-est", ...S },
      { id: "flow-b", kind: "response", label: "Débit canal sud-ouest", ...S },
      { id: "alarm", kind: "event", label: "Capteur pression actif", ...S },
    ],
    [
      { from: "valve", to: "flow-a", relation: "causes", ...S },
      { from: "valve", to: "flow-b", relation: "causes", ...S },
      { from: "valve", to: "alarm", relation: "triggers_response", relation_label: "Active la surveillance", ...K },
    ],
  ),

  "fan-in-short": causal(
    "fan-in-short",
    "Qu'est-ce qui alimente la ligne ?",
    [
      { id: "sensor-a", kind: "state", label: "Capteur A", ...S },
      { id: "sensor-b", kind: "state", label: "Capteur B", ...S },
      { id: "line", kind: "event", label: "Ligne alimentée", ...S },
    ],
    [
      { from: "sensor-a", to: "line", relation: "causes", ...S },
      { from: "sensor-b", to: "line", relation: "causes", ...S },
    ],
  ),

  "fan-in-long": causal(
    "fan-in-long",
    "Qu'est-ce qui alimente la ligne de production industrielle ?",
    [
      { id: "sensor-a", kind: "state", label: "Capteur pression amont", ...S },
      { id: "sensor-b", kind: "state", label: "Capteur débit auxiliaire", ...S },
      { id: "sensor-c", kind: "state", label: "Capteur réserve tampon", ...S },
      { id: "line", kind: "event", label: "Ligne alimentée", ...S },
    ],
    [
      { from: "sensor-a", to: "line", relation: "causes", ...S },
      { from: "sensor-b", to: "line", relation: "causes", ...S },
      { from: "sensor-c", to: "line", relation: "causes", ...S },
    ],
  ),

  "diamond-short": causal(
    "diamond-short",
    "Comment deux voies rejoignent-elles un tri ?",
    [
      { id: "sort", kind: "state", label: "Tri initial", ...S },
      { id: "lane-a", kind: "response", label: "Voie A", ...S },
      { id: "lane-b", kind: "response", label: "Voie B", ...S },
      { id: "merge", kind: "event", label: "Fusion contrôlée", ...S },
    ],
    [
      { from: "sort", to: "lane-a", relation: "causes", ...S },
      { from: "sort", to: "lane-b", relation: "causes", ...S },
      { from: "lane-a", to: "merge", relation: "causes", ...S },
      { from: "lane-b", to: "merge", relation: "causes", ...S },
    ],
  ),

  "diamond-long": causal(
    "diamond-long",
    "Comment deux voies logistiques rejoignent-elles une fusion contrôlée ?",
    [
      { id: "sort", kind: "state", label: "Tri initial entrepôt", ...S },
      { id: "lane-a", kind: "response", label: "Voie express fragile", ...S },
      { id: "lane-b", kind: "response", label: "Voie standard lourde", ...S },
      { id: "check", kind: "response", label: "Contrôle poids", ...S },
      { id: "merge", kind: "event", label: "Fusion contrôlée", ...S },
    ],
    [
      { from: "sort", to: "lane-a", relation: "causes", ...S },
      { from: "sort", to: "lane-b", relation: "causes", ...S },
      { from: "lane-a", to: "check", relation: "causes", ...S },
      { from: "lane-b", to: "check", relation: "causes", ...S },
      { from: "check", to: "merge", relation: "causes", ...S },
    ],
  ),

  "lateral-feedback-short": causal(
    "lateral-feedback-short",
    "Comment un stock bas se renforce ?",
    [
      { id: "low-stock", kind: "state", label: "Stock bas", ...S },
      { id: "reorder", kind: "response", label: "Commande urgente", ...S },
      { id: "delay", kind: "event", label: "Délai fournisseur", ...S },
    ],
    [
      { from: "low-stock", to: "reorder", relation: "causes", ...S },
      { from: "reorder", to: "delay", relation: "causes", ...S },
      { from: "delay", to: "low-stock", relation: "feeds_back", ...S },
    ],
  ),

  "lateral-feedback-long": causal(
    "lateral-feedback-long",
    "Comment un stock bas entretient-il une boucle de réapprovisionnement ?",
    [
      { id: "low-stock", kind: "state", label: "Stock bas entrepôt", ...S },
      { id: "reorder", kind: "response", label: "Commande urgente lancée", ...S },
      { id: "delay", kind: "event", label: "Délai fournisseur allongé", ...S },
      { id: "backlog", kind: "state", label: "Commandes en attente", ...S },
    ],
    [
      { from: "low-stock", to: "reorder", relation: "causes", ...S },
      { from: "reorder", to: "delay", relation: "causes", ...S },
      { from: "delay", to: "backlog", relation: "causes", ...S },
      { from: "backlog", to: "low-stock", relation: "feeds_back", ...S },
    ],
  ),

  "dependent-sequence-short": decision(
    "dependent-sequence-short",
    "Quel enchaînement pour ouvrir une bibliothèque ?",
    [
      { id: "start", kind: "entry", label: "Ouverture", ...S },
      { id: "check", kind: "test", label: "Vérifier accès", ...S },
      { id: "end", kind: "conclusion", label: "Accueil lecteurs", ...S },
      { id: "stop", kind: "dead-end", label: "Issue réservée", ...S },
    ],
    [
      { id: "b1", from: "start", to: "check", condition: "Démarrer", ...S },
      { id: "b2", from: "check", to: "end", condition: "Accès validé", ...S },
    ],
  ),

  "dependent-sequence-long": decision(
    "dependent-sequence-long",
    "Quel enchaînement pour ouvrir une bibliothèque municipale un matin de semaine ?",
    [
      { id: "start", kind: "entry", label: "Ouverture matinale", ...S },
      { id: "check", kind: "test", label: "Vérifier accès et personnel", ...S },
      { id: "prep", kind: "test", label: "Préparer salle lecture", ...S },
      { id: "end", kind: "conclusion", label: "Accueil lecteurs", ...S },
      { id: "stop", kind: "dead-end", label: "Issue réservée", ...S },
    ],
    [
      { id: "b1", from: "start", to: "check", condition: "Démarrer procédure", ...S },
      { id: "b2", from: "check", to: "prep", condition: "Accès et personnel OK", ...S },
      { id: "b3", from: "prep", to: "end", condition: "Salle prête", ...S },
    ],
  ),

  "binary-rule-out-short": decision(
    "binary-rule-out-short",
    "Faut-il arrêter la chaîne ?",
    [
      { id: "start", kind: "entry", label: "Contrôle", ...S },
      { id: "test", kind: "test", label: "Mesure température", ...K },
      { id: "stop", kind: "dead-end", label: "Arrêt sécurité", ...K },
      { id: "go", kind: "conclusion", label: "Poursuite", ...K },
    ],
    [
      { id: "b1", from: "start", to: "test", condition: "Lancer mesure", ...S },
      { id: "b2", from: "test", to: "stop", condition: "Température < 5 °C", ...K },
      { id: "b3", from: "test", to: "go", condition: "Température ≥ 5 °C", ...K },
    ],
  ),

  "binary-rule-out-long": decision(
    "binary-rule-out-long",
    "Faut-il arrêter la chaîne de production pour cause de température basse ?",
    [
      { id: "start", kind: "entry", label: "Contrôle début poste", ...S },
      { id: "test", kind: "test", label: "Mesure température cuve", ...K },
      { id: "stop", kind: "dead-end", label: "Arrêt sécurité immédiat", ...K },
      { id: "go", kind: "conclusion", label: "Poursuite normale", ...K },
    ],
    [
      { id: "b1", from: "start", to: "test", condition: "Lancer mesure cuve", ...S },
      { id: "b2", from: "test", to: "stop", condition: "Température < 5 °C", ...K },
      { id: "b3", from: "test", to: "go", condition: "Température ≥ 5 °C", ...K },
    ],
  ),

  "skip-level-branch-short": decision(
    "skip-level-branch-short",
    "Peut-on sauter une étape ?",
    [
      { id: "start", kind: "entry", label: "Entrée", ...S },
      { id: "fork", kind: "decision", label: "Choix route", ...S },
      { id: "middle", kind: "test", label: "Étape intermédiaire", ...S },
      { id: "end", kind: "conclusion", label: "Sortie", ...S },
      { id: "stop", kind: "dead-end", label: "Abandon", ...S },
    ],
    [
      { id: "b1", from: "start", to: "fork", condition: "Commencer", ...S },
      { id: "b2", from: "fork", to: "middle", condition: "Route standard", ...S },
      { id: "b3", from: "fork", to: "end", condition: "Raccourci direct", ...S },
      { id: "b4", from: "middle", to: "end", condition: "Après étape", ...S },
      { id: "b5", from: "fork", to: "stop", condition: "Annuler", ...S },
    ],
  ),

  "skip-level-branch-long": decision(
    "skip-level-branch-long",
    "Peut-on sauter une étape intermédiaire sur la ligne d'expédition ?",
    [
      { id: "start", kind: "entry", label: "Entrée entrepôt", ...S },
      { id: "fork", kind: "decision", label: "Choix route expédition", ...S },
      { id: "middle", kind: "test", label: "Étape contrôle poids obligatoire", ...S },
      { id: "end", kind: "conclusion", label: "Expédition validée", ...S },
      { id: "stop", kind: "dead-end", label: "Colis retenu", ...S },
    ],
    [
      { id: "b1", from: "start", to: "fork", condition: "Commencer tri", ...S },
      { id: "b2", from: "fork", to: "middle", condition: "Route standard avec pesée", ...S },
      { id: "b3", from: "fork", to: "end", condition: "Raccourci sans pesée autorisée", ...S },
      { id: "b4", from: "middle", to: "end", condition: "Après pesée conforme", ...S },
      { id: "b5", from: "fork", to: "stop", condition: "Colis non conforme", ...S },
    ],
  ),

  "monitoring-loop-short": decision(
    "monitoring-loop-short",
    "Comment surveiller une serre ?",
    [
      { id: "start", kind: "entry", label: "Démarrage", ...S },
      { id: "monitor", kind: "test", label: "Lecture capteur", ...S },
      { id: "alert", kind: "decision", label: "Seuil dépassé ?", ...S },
      { id: "action", kind: "conclusion", label: "Ouvrir vanne", ...S },
      { id: "stop", kind: "dead-end", label: "Maintenance", ...S },
    ],
    [
      { id: "b1", from: "start", to: "monitor", condition: "Initialiser", ...S },
      { id: "b2", from: "monitor", to: "alert", condition: "Mesure reçue", ...S },
      { id: "b3", from: "alert", to: "action", condition: "Humidité > 80 %", ...S },
      { id: "b4", from: "action", to: "monitor", condition: "Reprendre surveillance", ...S },
      { id: "b5", from: "alert", to: "monitor", condition: "Humidité ≤ 80 %", ...S },
      { id: "b6", from: "alert", to: "stop", condition: "Capteur défaillant", ...S },
    ],
  ),

  "monitoring-loop-long": decision(
    "monitoring-loop-long",
    "Comment surveiller en boucle une serre d'irrigation automatisée ?",
    [
      { id: "start", kind: "entry", label: "Démarrage cycle", ...S },
      { id: "monitor", kind: "test", label: "Lecture capteur humidité", ...S },
      { id: "alert", kind: "decision", label: "Seuil humidité dépassé ?", ...S },
      { id: "action", kind: "conclusion", label: "Ouvrir vanne d'appoint", ...S },
      { id: "stop", kind: "dead-end", label: "Maintenance capteur", ...S },
    ],
    [
      { id: "b1", from: "start", to: "monitor", condition: "Initialiser cycle", ...S },
      { id: "b2", from: "monitor", to: "alert", condition: "Mesure reçue", ...S },
      { id: "b3", from: "alert", to: "action", condition: "Humidité > 80 %", ...S },
      { id: "b4", from: "action", to: "monitor", condition: "Reprendre surveillance", ...S },
      { id: "b5", from: "alert", to: "monitor", condition: "Humidité ≤ 80 %", ...S },
      { id: "b6", from: "alert", to: "stop", condition: "Capteur défaillant", ...S },
    ],
  ),

  "single-context-short": threshold(
    "single-context-short",
    "Comment lire un seuil de vent ?",
    [
      {
        id: "ctx-wind",
        label: "Observatoire côtier",
        class: "scaffolding",
        scales: [scale("s1", "Vitesse vent", "< 25 km/h", 25, "km/h", { low: "Calme", high: "Alerte" })],
      },
    ],
  ),

  "single-context-long": threshold(
    "single-context-long",
    "Comment lire un seuil de vent sur l'observatoire côtier fictif ?",
    [
      {
        id: "ctx-wind",
        label: "Observatoire côtier — zone exposée",
        class: "scaffolding",
        scales: [
          scale("s1", "Vitesse vent moyenne", "< 25 km/h", 25, "km/h", { low: "Conditions calmes", high: "Alerte opérationnelle" }),
        ],
      },
    ],
  ),

  "dual-context-short": threshold(
    "dual-context-short",
    "Comment lire deux contextes météo ?",
    [
      {
        id: "ctx-day",
        label: "Jour ensoleillé",
        class: "scaffolding",
        scales: [scale("s1", "Température", "< 30 °C", 30, "°C", { low: "Confort", high: "Vigilance" })],
      },
      {
        id: "ctx-night",
        label: "Nuit humide",
        class: "scaffolding",
        scales: [scale("s2", "Humidité", "< 85 %", 85, "%", { low: "Sec", high: "Humide" })],
      },
    ],
  ),

  "dual-context-long": threshold(
    "dual-context-long",
    "Comment lire deux contextes météo fictifs pour une station automatisée ?",
    [
      {
        id: "ctx-day",
        label: "Jour ensoleillé — capteur extérieur",
        class: "scaffolding",
        scales: [scale("s1", "Température air", "< 30 °C", 30, "°C", { low: "Confort thermique", high: "Vigilance chaleur" })],
      },
      {
        id: "ctx-night",
        label: "Nuit humide — capteur abri",
        class: "scaffolding",
        scales: [scale("s2", "Humidité relative", "< 85 %", 85, "%", { low: "Atmosphère sèche", high: "Condensation probable" })],
      },
    ],
  ),

  "embedded-fragment-short": decision(
    "embedded-fragment-short",
    "Quand intégrer un seuil ?",
    [
      { id: "start", kind: "entry", label: "Entrée", ...S },
      { id: "test", kind: "test", label: "Mesure stock", ...S },
      { id: "end", kind: "conclusion", label: "Réappro", ...S },
      { id: "stop", kind: "dead-end", label: "Attente", ...S },
    ],
    [
      { id: "b1", from: "start", to: "test", condition: "Contrôler", ...S },
      {
        id: "b2",
        from: "test",
        to: "end",
        condition: "Stock bas",
        class: "scaffolding",
        threshold_fragment: {
          context: "Entrepôt frigorifique",
          low_band_meaning: "Réapprovisionner",
          scales: [fragmentScale("sf1", "Niveau palette", "< 10 caisses", 10, "caisses")],
        },
      },
      { id: "b3", from: "test", to: "stop", condition: "Stock suffisant", ...S },
    ],
  ),

  "embedded-fragment-long": decision(
    "embedded-fragment-long",
    "Quand intégrer un fragment de seuil dans un flux logistique ?",
    [
      { id: "start", kind: "entry", label: "Entrée contrôle stock", ...S },
      { id: "test", kind: "test", label: "Mesure niveau palette", ...S },
      { id: "end", kind: "conclusion", label: "Lancer réapprovisionnement", ...S },
      { id: "stop", kind: "dead-end", label: "Attente prochain cycle", ...S },
    ],
    [
      { id: "b1", from: "start", to: "test", condition: "Contrôler niveau", ...S },
      {
        id: "b2",
        from: "test",
        to: "end",
        condition: "Stock bas selon seuil",
        class: "scaffolding",
        threshold_fragment: {
          context: "Entrepôt frigorifique zone B",
          low_band_meaning: "Réapprovisionner avant rupture",
          scales: [
            fragmentScale("sf1", "Niveau palette", "< 10 caisses", 10, "caisses"),
          ],
        },
      },
      { id: "b3", from: "test", to: "stop", condition: "Stock suffisant", ...S },
    ],
  ),
};

// HTML primitives
function matrix(id, question, poles, dimensions) {
  return {
    spec_version: "0.2",
    primitive: "comparison-matrix",
    technology: "semantic-html",
    chapter: BASE.chapter,
    element: `vcck-${id}`,
    question,
    provenance: BASE.provenance,
    poles,
    dimensions,
  };
}

function enumeration(id, question, set, groups) {
  return {
    spec_version: "0.2",
    primitive: "enumeration-set",
    technology: "semantic-html",
    chapter: BASE.chapter,
    element: `vcck-${id}`,
    question,
    provenance: BASE.provenance,
    set,
    groups,
  };
}

function quantity(id, question, target, identities, states, insights) {
  return {
    spec_version: "0.2",
    primitive: "quantity-model",
    technology: "semantic-html",
    chapter: BASE.chapter,
    element: `vcck-${id}`,
    question,
    provenance: BASE.provenance,
    target,
    identities,
    states,
    insights,
  };
}

Object.assign(FIXTURES, {
  "two-pole-short": matrix(
    "two-pole-short",
    "Quelle différence entre camion et train ?",
    [
      { id: "road", label: "Camion", pole_type: "entity", ...S },
      { id: "rail", label: "Train", pole_type: "entity", ...S },
    ],
    [
      {
        id: "dim-speed",
        label: "Vitesse",
        ...S,
        cells: [
          { pole: "road", items: [{ id: "r1", label: "Flexible", ...K }] },
          { pole: "rail", items: [{ id: "t1", label: "Massifiée", ...K }] },
        ],
      },
    ],
  ),

  "two-pole-long": matrix(
    "two-pole-long",
    "Quelle différence entre transport routier et ferroviaire pour un hub logistique ?",
    [
      { id: "road", label: "Camion porteur", pole_type: "entity", ...S },
      { id: "rail", label: "Train complet", pole_type: "entity", ...S },
    ],
    [
      {
        id: "dim-speed",
        label: "Vitesse effective",
        ...S,
        cells: [
          { pole: "road", items: [{ id: "r1", label: "Flexible dernier km", ...K }] },
          { pole: "rail", items: [{ id: "t1", label: "Massifiée longue distance", ...K }] },
        ],
      },
      {
        id: "dim-cost",
        label: "Coût variable",
        ...S,
        cells: [
          { pole: "road", items: [{ id: "r2", label: "Élevé par palette", ...K }] },
          { pole: "rail", items: [{ id: "t2", label: "Bas par tonne", ...K }] },
        ],
      },
    ],
  ),

  "three-pole-reflow-short": matrix(
    "three-pole-reflow-short",
    "Comparer trois modes d'irrigation ?",
    [
      { id: "drip", label: "Goutte-à-goutte", pole_type: "entity", ...S },
      { id: "sprink", label: "Aspersion", pole_type: "entity", ...S },
      { id: "flood", label: "Submersion", pole_type: "entity", ...S },
    ],
    [
      {
        id: "dim-water",
        label: "Eau utilisée",
        ...S,
        cells: [
          { pole: "drip", items: [{ id: "d1", label: "Faible", ...K }] },
          { pole: "sprink", items: [{ id: "s1", label: "Moyenne", ...K }] },
          { pole: "flood", items: [{ id: "f1", label: "Forte", ...K }] },
        ],
      },
    ],
  ),

  "three-pole-reflow-long": matrix(
    "three-pole-reflow-long",
    "Comparer trois modes d'irrigation pour une parcelle fictive ?",
    [
      { id: "drip", label: "Goutte-à-goutte", pole_type: "entity", ...S },
      { id: "sprink", label: "Aspersion", pole_type: "entity", ...S },
      { id: "flood", label: "Submersion", pole_type: "entity", ...S },
    ],
    [
      {
        id: "dim-water",
        label: "Eau utilisée",
        ...S,
        cells: [
          { pole: "drip", items: [{ id: "d1", label: "Faible consommation", ...K }] },
          { pole: "sprink", items: [{ id: "s1", label: "Consommation moyenne", ...K }] },
          { pole: "flood", items: [{ id: "f1", label: "Forte consommation", ...K }] },
        ],
      },
      {
        id: "dim-labor",
        label: "Main-d'œuvre",
        ...S,
        cells: [
          { pole: "drip", items: [{ id: "d2", label: "Installation initiale", ...K }] },
          { pole: "sprink", items: [{ id: "s2", label: "Entretien régulier", ...K }] },
          { pole: "flood", items: [{ id: "f2", label: "Surveillance continue", ...K }] },
        ],
      },
    ],
  ),

  "flat-concurrent-short": enumeration(
    "flat-concurrent-short",
    "Quels capteurs sont actifs ?",
    {
      id: "set-sensors",
      label: "Capteurs actifs",
      membership_logic: "concurrent-set",
      ordering_semantics: "none",
      expected_cardinality: 3,
      ...S,
    },
    [
      {
        id: "grp-all",
        label: "Ensemble",
        purpose: "Liste concurrente",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 3,
        ...S,
        items: [
          { id: "i1", label: "Température", ...K },
          { id: "i2", label: "Humidité", ...K },
          { id: "i3", label: "Pression", ...K },
        ],
      },
    ],
  ),

  "flat-concurrent-long": enumeration(
    "flat-concurrent-long",
    "Quels capteurs industriels sont actifs simultanément sur la ligne ?",
    {
      id: "set-sensors",
      label: "Capteurs actifs simultanés",
      membership_logic: "concurrent-set",
      ordering_semantics: "none",
      expected_cardinality: 4,
      ...S,
    },
    [
      {
        id: "grp-all",
        label: "Capteurs ligne A",
        purpose: "Liste concurrente exhaustive",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 4,
        ...S,
        items: [
          { id: "i1", label: "Température cuve", ...K },
          { id: "i2", label: "Humidité air", ...K },
          { id: "i3", label: "Pression circuit", ...K },
          { id: "i4", label: "Débit sortie", ...K },
        ],
      },
    ],
  ),

  "grouped-concurrent-short": enumeration(
    "grouped-concurrent-short",
    "Quels groupes alimentent l'entrepôt ?",
    {
      id: "set-supply",
      label: "Alimentation entrepôt",
      membership_logic: "concurrent-set",
      ordering_semantics: "none",
      expected_cardinality: 4,
      ...S,
    },
    [
      {
        id: "grp-inbound",
        label: "Entrées",
        purpose: "Flux entrants",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 2,
        ...S,
        items: [
          { id: "i1", label: "Fournisseur A", ...K },
          { id: "i2", label: "Fournisseur B", ...K },
        ],
      },
      {
        id: "grp-internal",
        label: "Interne",
        purpose: "Flux internes",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 2,
        ...S,
        items: [
          { id: "i3", label: "Retour client", ...K },
          { id: "i4", label: "Transfert dépôt", ...K },
        ],
      },
    ],
  ),

  "grouped-concurrent-long": enumeration(
    "grouped-concurrent-long",
    "Quels groupes concurrents alimentent un entrepôt régional fictif ?",
    {
      id: "set-supply",
      label: "Alimentation entrepôt régional",
      membership_logic: "concurrent-set",
      ordering_semantics: "none",
      expected_cardinality: 5,
      ...S,
    },
    [
      {
        id: "grp-inbound",
        label: "Entrées fournisseurs",
        purpose: "Flux entrants",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 3,
        ...S,
        items: [
          { id: "i1", label: "Fournisseur A — sec", ...K },
          { id: "i2", label: "Fournisseur B — frais", ...K },
          { id: "i3", label: "Fournisseur C — urgent", ...K },
        ],
      },
      {
        id: "grp-internal",
        label: "Flux internes",
        purpose: "Réappro interne",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 2,
        ...S,
        items: [
          { id: "i4", label: "Retour magasin", ...K },
          { id: "i5", label: "Transfert dépôt voisin", ...K },
        ],
      },
    ],
  ),

  "identity-short": quantity(
    "identity-short",
    "Quelle identité lie débit et volume ?",
    { id: "vol", label: "Volume V", unit: "m³", ...K },
    [{ id: "id1", expression: "V = Q × t", relation_type: "identity-product", ...K }],
    [],
    [{ id: "ins1", label: "V augmente si Q augmente", ...K }],
  ),

  "identity-long": quantity(
    "identity-long",
    "Quelle identité lie débit, volume et durée sur un canal d'irrigation ?",
    { id: "vol", label: "Volume V", unit: "m³", ...K },
    [
      { id: "id1", expression: "V = Q × t", relation_type: "identity-product", ...K },
      { id: "id2", expression: "Q = V / t", relation_type: "identity-ratio", ...K },
    ],
    [],
    [{ id: "ins1", label: "V augmente proportionnellement à Q", ...K }],
  ),

  "two-state-short": quantity(
    "two-state-short",
    "Comment évolue le stock ?",
    { id: "stock", label: "Stock S", unit: "caisses", ...K },
    [{ id: "id1", expression: "S = entrées − sorties", relation_type: "identity-difference", ...K }],
    [
      {
        id: "state-a",
        label: "Matin",
        values: [
          { quantity: "entrées", value: 10, unit: "caisses", ...K },
          { quantity: "sorties", value: 4, unit: "caisses", ...K },
          { quantity: "S", value: 6, unit: "caisses", ...K },
        ],
      },
      {
        id: "state-b",
        label: "Soir",
        values: [
          { quantity: "entrées", value: 10, unit: "caisses", ...K },
          { quantity: "sorties", value: 9, unit: "caisses", ...K },
          { quantity: "S", value: 1, unit: "caisses", ...K },
        ],
      },
    ],
    [{ id: "ins1", label: "S baisse quand sorties augmentent", ...K }],
  ),

  "two-state-long": quantity(
    "two-state-long",
    "Comment évolue le stock d'un entrepôt fictif entre matin et soir ?",
    { id: "stock", label: "Stock S", unit: "caisses", ...K },
    [{ id: "id1", expression: "S = entrées − sorties", relation_type: "identity-difference", ...K }],
    [
      {
        id: "state-a",
        label: "Matin — après réception",
        values: [
          { quantity: "entrées", value: 10, unit: "caisses", ...K },
          { quantity: "sorties", value: 4, unit: "caisses", ...K },
          { quantity: "S", value: 6, unit: "caisses", ...K },
        ],
      },
      {
        id: "state-b",
        label: "Soir — après expéditions",
        values: [
          { quantity: "entrées", value: 10, unit: "caisses", ...K },
          { quantity: "sorties", value: 9, unit: "caisses", ...K },
          { quantity: "S", value: 1, unit: "caisses", ...K },
        ],
      },
    ],
    [{ id: "ins1", label: "S baisse lorsque sorties augmentent", ...K }],
  ),
});

// Negative fixtures
const NEGATIVE = {
  "chain-negative": causal(
    "chain-negative",
    "Negative — branchement invalide pour chain",
    [
      { id: "a", kind: "state", label: "Origine", ...S },
      { id: "b", kind: "response", label: "Branche B", ...S },
      { id: "c", kind: "response", label: "Branche C", ...S },
    ],
    [
      { from: "a", to: "b", relation: "causes", ...S },
      { from: "a", to: "c", relation: "causes", ...S },
    ],
  ),

  "fan-out-negative": causal(
    "fan-out-negative",
    "Negative — chaîne pure pour fan-out",
    [
      { id: "a", kind: "state", label: "A", ...S },
      { id: "b", kind: "state", label: "B", ...S },
    ],
    [{ from: "a", to: "b", relation: "causes", ...S }],
  ),

  "fan-in-negative": causal(
    "fan-in-negative",
    "Negative — une seule source",
    [
      { id: "a", kind: "state", label: "A", ...S },
      { id: "b", kind: "state", label: "B", ...S },
    ],
    [{ from: "a", to: "b", relation: "causes", ...S }],
  ),

  "diamond-negative": {
    spec_version: "0.1",
    primitive: "causal-graph",
    chapter: BASE.chapter,
    element: "vcck-diamond-negative",
    question: "Negative — topologie K3,2 non planaire",
    nodes: [
      { id: "s1", kind: "response", label: "Source un", ...S },
      { id: "s2", kind: "response", label: "Source deux", ...S },
      { id: "s3", kind: "response", label: "Source trois", ...S },
      { id: "t1", kind: "state", label: "Cible alpha", ...S },
      { id: "t2", kind: "state", label: "Cible beta", ...S },
    ],
    edges: [
      { from: "s1", to: "t1", relation: "causes", ...S },
      { from: "s1", to: "t2", relation: "causes", ...S },
      { from: "s2", to: "t1", relation: "causes", ...S },
      { from: "s2", to: "t2", relation: "causes", ...S },
      { from: "s3", to: "t1", relation: "causes", ...S },
      { from: "s3", to: "t2", relation: "causes", ...S },
    ],
  },

  "lateral-feedback-negative": causal(
    "lateral-feedback-negative",
    "Negative — cycle sans feeds_back",
    [
      { id: "a", kind: "state", label: "A", ...S },
      { id: "b", kind: "state", label: "B", ...S },
      { id: "c", kind: "state", label: "C", ...S },
    ],
    [
      { from: "a", to: "b", relation: "causes", ...S },
      { from: "b", to: "c", relation: "causes", ...S },
      { from: "c", to: "a", relation: "causes", ...S },
    ],
  ),

  "dependent-sequence-negative": decision(
    "dependent-sequence-negative",
    "Negative — branche saut de niveau",
    [
      { id: "start", kind: "entry", label: "Start", ...S },
      { id: "mid", kind: "test", label: "Mid", ...S },
      { id: "end", kind: "conclusion", label: "End", ...S },
      { id: "stop", kind: "dead-end", label: "Stop", ...S },
    ],
    [
      { id: "b1", from: "start", to: "mid", condition: "A", ...S },
      { id: "b2", from: "start", to: "end", condition: "Skip", ...S },
      { id: "b3", from: "mid", to: "stop", condition: "B", ...S },
    ],
  ),

  "binary-rule-out-negative": decision(
    "binary-rule-out-negative",
    "Negative — pas de dead-end",
    [
      { id: "start", kind: "entry", label: "Start", ...S },
      { id: "test", kind: "test", label: "Test", ...S },
      { id: "go", kind: "conclusion", label: "Go", ...S },
    ],
    [
      { id: "b1", from: "start", to: "test", condition: "Run", ...S },
      { id: "b2", from: "test", to: "go", condition: "OK", ...S },
    ],
  ),

  "skip-level-branch-negative": decision(
    "skip-level-branch-negative",
    "Negative — séquence linéaire",
    [
      { id: "start", kind: "entry", label: "Start", ...S },
      { id: "mid", kind: "test", label: "Mid", ...S },
      { id: "end", kind: "conclusion", label: "End", ...S },
      { id: "stop", kind: "dead-end", label: "Stop", ...S },
    ],
    [
      { id: "b1", from: "start", to: "mid", condition: "A", ...S },
      { id: "b2", from: "mid", to: "end", condition: "B", ...S },
      { id: "b3", from: "mid", to: "stop", condition: "C", ...S },
    ],
  ),

  "monitoring-loop-negative": decision(
    "monitoring-loop-negative",
    "Negative — pas de boucle",
    [
      { id: "start", kind: "entry", label: "Start", ...S },
      { id: "test", kind: "test", label: "Test", ...S },
      { id: "end", kind: "conclusion", label: "End", ...S },
      { id: "stop", kind: "dead-end", label: "Stop", ...S },
    ],
    [
      { id: "b1", from: "start", to: "test", condition: "Run", ...S },
      { id: "b2", from: "test", to: "end", condition: "OK", ...S },
      { id: "b3", from: "test", to: "stop", condition: "Fail", ...S },
    ],
  ),

  "single-context-negative": threshold(
    "single-context-negative",
    "Negative — deux contextes pour single-context",
    [
      { id: "c1", label: "Ctx1", class: "scaffolding", scales: [scale("s1", "A", "< 1 u", 1, "u", { low: "L", high: "H" })] },
      { id: "c2", label: "Ctx2", class: "scaffolding", scales: [scale("s2", "B", "< 2 u", 2, "u", { low: "L", high: "H" })] },
    ],
  ),

  "dual-context-negative": threshold(
    "dual-context-negative",
    "Negative — un seul contexte pour dual-context",
    [
      { id: "c1", label: "Ctx1", class: "scaffolding", scales: [scale("s1", "A", "< 1 u", 1, "u", { low: "L", high: "H" })] },
    ],
  ),

  "embedded-fragment-negative": decision(
    "embedded-fragment-negative",
    "Negative — pas de fragment",
    [
      { id: "start", kind: "entry", label: "Start", ...S },
      { id: "test", kind: "test", label: "Test", ...S },
      { id: "end", kind: "conclusion", label: "End", ...S },
      { id: "stop", kind: "dead-end", label: "Stop", ...S },
    ],
    [
      { id: "b1", from: "start", to: "test", condition: "Run", ...S },
      { id: "b2", from: "test", to: "end", condition: "OK", ...S },
      { id: "b3", from: "test", to: "stop", condition: "Fail", ...S },
    ],
  ),

  "two-pole-negative": matrix(
    "two-pole-negative",
    "Negative — trois pôles",
    [
      { id: "a", label: "A", pole_type: "entity", ...S },
      { id: "b", label: "B", pole_type: "entity", ...S },
      { id: "c", label: "C", pole_type: "entity", ...S },
    ],
    [
      {
        id: "d1",
        label: "Dim",
        ...S,
        cells: [
          { pole: "a", items: [{ id: "i1", label: "X", ...K }] },
          { pole: "b", items: [{ id: "i2", label: "Y", ...K }] },
          { pole: "c", items: [{ id: "i3", label: "Z", ...K }] },
        ],
      },
    ],
  ),

  "three-pole-reflow-negative": matrix(
    "three-pole-reflow-negative",
    "Negative — deux pôles",
    [
      { id: "a", label: "A", pole_type: "entity", ...S },
      { id: "b", label: "B", pole_type: "entity", ...S },
    ],
    [
      {
        id: "d1",
        label: "Dim",
        ...S,
        cells: [
          { pole: "a", items: [{ id: "i1", label: "X", ...K }] },
          { pole: "b", items: [{ id: "i2", label: "Y", ...K }] },
        ],
      },
    ],
  ),

  "flat-concurrent-negative": enumeration(
    "flat-concurrent-negative",
    "Negative — groupes multiples",
    {
      id: "set",
      label: "Set",
      membership_logic: "concurrent-set",
      ordering_semantics: "none",
      expected_cardinality: 2,
      ...S,
    },
    [
      {
        id: "g1",
        label: "G1",
        purpose: "P1",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 1,
        ...S,
        items: [{ id: "i1", label: "A", ...K }],
      },
      {
        id: "g2",
        label: "G2",
        purpose: "P2",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 1,
        ...S,
        items: [{ id: "i2", label: "B", ...K }],
      },
    ],
  ),

  "grouped-concurrent-negative": enumeration(
    "grouped-concurrent-negative",
    "Negative — un seul groupe",
    {
      id: "set",
      label: "Set",
      membership_logic: "concurrent-set",
      ordering_semantics: "none",
      expected_cardinality: 2,
      ...S,
    },
    [
      {
        id: "g1",
        label: "G1",
        purpose: "P1",
        coverage: "exhaustive",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 2,
        ...S,
        items: [
          { id: "i1", label: "A", ...K },
          { id: "i2", label: "B", ...K },
        ],
      },
    ],
  ),

  "identity-negative": quantity(
    "identity-negative",
    "Negative — deux états",
    { id: "q", label: "Q", unit: "u", ...K },
    [{ id: "id1", expression: "Q = A × B", relation_type: "identity-product", ...K }],
    [
      { id: "s1", label: "S1", values: [{ quantity: "A", value: 1, unit: "u", ...K }] },
      { id: "s2", label: "S2", values: [{ quantity: "A", value: 2, unit: "u", ...K }] },
    ],
    [],
  ),

  "two-state-negative": quantity(
    "two-state-negative",
    "Negative — pas d'états",
    { id: "q", label: "Q", unit: "u", ...K },
    [{ id: "id1", expression: "Q = A", relation_type: "depends-on", ...K }],
    [],
    [],
  ),
};

for (const [name, doc] of Object.entries(FIXTURES)) {
  writeYaml(path.join(VCCK_POSITIVE, `${name}.yaml`), doc);
}

for (const [name, doc] of Object.entries(NEGATIVE)) {
  writeYaml(path.join(VCCK_NEGATIVE, `${name}.yaml`), doc);
}

console.log(`Wrote ${Object.keys(FIXTURES).length} positive and ${Object.keys(NEGATIVE).length} negative fixtures.`);
