// Research projects, in page order (001 → 005). Feeds the RoboZET feature card on
// the home page (partials/research-feature.njk) and the project list on the
// research page (partials/research-list.njk).
//
// RoboZET lives only here. The other projects come from products.js (badge, desc,
// tags, page), so their copy is not repeated; this file adds only what the cards
// need on top:
//   tagline    shown after the title ("Title: tagline."); taken from each detail page's <title>
//   cardTitle  optional display name when it differs from products.js
// Each key also has a `.research-feature--{key}` modifier in styles.css with its image.
import products from "./products.js";

const roboZet = {
  key: "robo-zet",
  title: "RoboZET",
  page: "/research/robo-zet/",
  idx: "001",
  badge: "Phase 1 · Proof of concept",
  badgeClass: "badge--access",
  tagline: "AI that drives trams",
  desc: "An AI system that can drive a tram, starting on Zagreb's network. The first version already reads the street ahead and decides how the tram should respond.",
  tags: ["Autonomous mobility", "Computer vision", "YOLO11 · ByteTrack", "Jev by TypeSafe AI"],
};

const extras = {
  asai: { cardTitle: "Asai", tagline: "an AI with a personality of its own" },
  interpress: { tagline: "your documents in every language" },
  gedor: { tagline: "open-weight models, hosted in the EU" },
  webagen: { tagline: "an agent that builds your website, not a template" },
};

export default [roboZet, ...products.map((p) => ({ ...p, ...extras[p.key] }))].sort((a, b) => a.idx.localeCompare(b.idx));
