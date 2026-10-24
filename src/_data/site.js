// Global site data, available in every template as `site`.
//
// SITE_URL is the absolute public URL of the site, without a trailing slash
// (e.g. https://astrosynapse.ai).
// It is used for canonical URLs, Open Graph tags, JSON-LD and the sitemap.
// It is set in the committed .env file.
const url = (process.env.SITE_URL || "https://astrosynapse.ai").replace(/\/+$/, "");

export default {
  url,
  name: "Astro Synapse",
  legalName: "Astro Synapse Limited",
  description:
    "We research, build, and ship AI systems: RAG pipelines, autonomous agents, and embedded engineering teams for businesses that need real infrastructure, not another chatbot wrapper.",
  locale: "en_IE",
  themeColor: "#04050a",
  email: "info@astrosynapse.ai",
  twitterHandle: "@astrosynapselab",
  address: {
    street: "71 Lower Baggot Street",
    locality: "Dublin 2",
    region: "Co. Dublin",
    postalCode: "D02 P593",
    country: "IE",
    countryName: "Ireland",
  },
  social: [
    { label: "Twitter/X", url: "https://twitter.com/astrosynapselab" },
    { label: "LinkedIn", url: "https://www.linkedin.com/company/astro-synapse/" },
    { label: "GitHub", url: "https://github.com/AstroSynapseLab" },
  ],
  // Primary navigation (full-screen menu), in display order.
  nav: [
    { key: "home", label: "Home", url: "/" },
    { key: "research", label: "Research", url: "/research/" },
    { key: "solutions", label: "Solutions", url: "/solutions/" },
    { key: "use-cases", label: "Use Cases", url: "/use-cases/" },
    { key: "about", label: "About", url: "/about/" },
    { key: "contact", label: "Contact", url: "/contact/" },
  ],
  // Footer navigation is a two-column grid filled row by row.
  footerNav: ["home", "use-cases", "research", "about", "solutions", "contact"],
  // Images used for social previews (og:image). Dimensions are required for good previews.
  ogImages: {
    "hero-space": { src: "/assets/video/hero-space.jpg", width: 1920, height: 1080 },
    "hero-planet": { src: "/assets/video/hero-planet.jpg", width: 1280, height: 720 },
    "ringed-planet": { src: "/assets/video/ringed-planet.jpg", width: 1280, height: 720 },
    "deep-space": { src: "/assets/video/deep-space.jpg", width: 1280, height: 720 },
    "products-eclipse": { src: "/assets/images/products-eclipse.jpg", width: 1400, height: 1000 },
    "robo-zet": { src: "https://struki84.github.io/robo-zet-web/assets/vision-system.png", width: 896, height: 616 },
    asai: { src: "/assets/images/og-asai.jpg", width: 1200, height: 630 },
  },
};
