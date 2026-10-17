// Old *.html URLs redirect to the clean URLs. Each entry produces a small redirect page
// (GitHub Pages cannot send real 301s), so old links and bookmarks keep working.
const pages = ["about", "contact", "research", "solutions", "use-cases", "privacy-policy", "terms-of-service"];
const research = ["asai", "gedor", "interpress", "robo-zet", "webagen"];

export default [
  ...pages.map((p) => ({ from: `/${p}.html`, to: `/${p}/` })),
  ...research.map((p) => ({ from: `/research/${p}.html`, to: `/research/${p}/` })),
  { from: "/products.html", to: "/research/" },
];
