// schema.org structured data (JSON-LD) helpers, exposed to templates as filters.

export function organizationSchema(site) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: `${site.url}/`,
    logo: `${site.url}/assets/images/icon-512.png`,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    sameAs: site.social.map((s) => s.url),
  };
}

export function websiteSchema(site) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.name,
    url: `${site.url}/`,
    publisher: { "@id": `${site.url}/#organization` },
  };
}

/**
 * Trail: Home, then Research for research subpages, then the current page.
 * @param {object} site  global site data
 * @param {string} url   page.url, e.g. "/research/asai/"
 * @param {string} name  short name of the current page
 */
export function breadcrumbSchema(site, url, name) {
  const trail = [{ name: "Home", url: "/" }];
  if (url.startsWith("/research/") && url !== "/research/") trail.push({ name: "Research", url: "/research/" });
  trail.push({ name, url });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: site.url + item.url,
    })),
  };
}
