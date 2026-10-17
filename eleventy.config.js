import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { HtmlBasePlugin } from "@11ty/eleventy";
import browserslist from "browserslist";
import * as esbuild from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";
import { bundle as bundleCss, browserslistToTargets } from "lightningcss";
import { breadcrumbSchema, organizationSchema, websiteSchema } from "./lib/schema.js";

// Build settings (SITE_URL, PATH_PREFIX) live in the committed .env file.
// Variables already set in the environment win over the file.
try {
  process.loadEnvFile();
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

// Deploy sub-path, e.g. "/astro-web/" for a GitHub project page or "/" for a custom domain.
const pathPrefix = process.env.PATH_PREFIX || "/";

const CSS_ENTRY = "src/assets/css/styles.css";
const JS_ENTRY = "src/assets/js/main.js";
const CSS_OUT = "assets/css/main.css";
const JS_OUT = "assets/js/main.js";

/** Content hashes of built assets, used for cache-busting query strings. */
const assetHashes = new Map();

const hash = (data) => crypto.createHash("sha256").update(data).digest("hex").slice(0, 10);

async function writeAsset(outputDir, file, contents) {
  const target = path.join(outputDir, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents);
  assetHashes.set(`/${file}`, hash(contents));
}

async function buildCss(outputDir, minify) {
  const { code } = bundleCss({
    filename: CSS_ENTRY,
    minify,
    targets: browserslistToTargets(browserslist()),
  });
  await writeAsset(outputDir, CSS_OUT, code);
}

async function buildJs(outputDir, minify) {
  const result = await esbuild.build({
    entryPoints: [JS_ENTRY],
    bundle: true,
    format: "iife",
    target: "es2020",
    minify,
    write: false,
  });
  await writeAsset(outputDir, JS_OUT, result.outputFiles[0].contents);
}

/** Prefix a root-relative path with the deploy path. Absolute URLs pass through. */
function withBase(url) {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return url;
  return path.posix.join(pathPrefix, url);
}

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({
    "src/assets/fonts": "assets/fonts",
    "src/assets/images": "assets/images",
    "src/assets/video": "assets/video",
  });

  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("src/assets/js/");
  // CSS (Lightning CSS) and JS (esbuild) are bundled outside the template pipeline.
  // Output is minified for `npm run build`, readable for `npm run dev`.
  eleventyConfig.on("eleventy.before", async ({ directories, runMode }) => {
    const minify = runMode === "build";
    await Promise.all([buildCss(directories.output, minify), buildJs(directories.output, minify)]);
  });

  // ---- filters ----
  eleventyConfig.addFilter("withBase", withBase);
  /** Append a content hash so browsers re-fetch an asset when it changes. */
  eleventyConfig.addFilter("rev", (url) => (assetHashes.has(url) ? `${url}?v=${assetHashes.get(url)}` : url));
  /** Turn a root-relative path into an absolute URL on the public site. */
  eleventyConfig.addFilter("absoluteUrl", function (url) {
    if (/^https?:\/\//.test(url)) return url;
    return this.ctx.site.url + url;
  });
  /** Serialize data for an inline <script> (JSON / JSON-LD) without breaking out of the tag. */
  eleventyConfig.addFilter("jsonScript", (data) => JSON.stringify(data).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString().slice(0, 10));
  eleventyConfig.addFilter("findNav", (nav, key) => nav.find((item) => item.key === key));
  /** Product data for the quick-view panel, with internal links resolved for the deploy path. */
  eleventyConfig.addFilter("panelData", (products) =>
    Object.fromEntries(
      products.map(({ key, title, idx, badge, badgeClass, desc, link, linkLabel, page, tiles, tags }) => [
        key,
        { title, idx, badge, badgeClass, desc, link: withBase(link), linkLabel, page: withBase(page), external: /^https?:/.test(link), tiles, tags },
      ]),
    ),
  );

  eleventyConfig.addFilter("organizationSchema", organizationSchema);
  eleventyConfig.addFilter("websiteSchema", websiteSchema);
  eleventyConfig.addFilter("breadcrumbSchema", breadcrumbSchema);

  // ---- production HTML minification ----
  eleventyConfig.addTransform("minify-html", async function (content) {
    if (process.env.ELEVENTY_RUN_MODE !== "build" || !this.page.outputPath?.endsWith(".html")) return content;
    return minifyHtml(content, {
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
      useShortDoctype: true,
    });
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", layouts: "_includes/layouts", data: "_data" },
    pathPrefix,
    templateFormats: ["html", "njk"],
    htmlTemplateEngine: "njk",
  };
}
