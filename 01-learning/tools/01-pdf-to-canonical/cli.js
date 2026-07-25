#!/usr/bin/env node
import { convertCollege } from "./lib/pipeline.js";
import { CONVERTER_VERSION } from "./lib/manifest.js";

function printHelp() {
  console.log(`lou-pdf-to-canonical v${CONVERTER_VERSION}

Convert an official EDN College PDF into canonical Markdown.

USAGE
  node cli.js --specialty <name> --edition <year>
  node cli.js --input <path/to/official-college.pdf>

OPTIONS
  --specialty <name>   Specialty folder under full-edn/ (e.g. cardiology)
  --edition <year>     Edition year or label (e.g. 2022 or edition-2022)
  --input <pdf>        Explicit PDF path (overrides specialty/edition resolution)
  --outdir <dir>       Output directory (default: same directory as the PDF)
  --root <dir>         Path to 01-learning/ (default: inferred from tool location)
  --dry-run            Run conversion + validation without writing files
  --verbose            Progress to stderr
  --help               Show this help

OUTPUT (written next to the PDF unless --outdir is set)
  official-college.md
  manifest.json

EXAMPLES
  node cli.js --specialty cardiology --edition 2022
  node cli.js --input ../../full-edn/cardiology/edition-2022/official-college.pdf
`);
}

function parseArgs(argv) {
  const opts = {
    verbose: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v == null) throw new Error(`Missing value after ${a}`);
      return v;
    };
    switch (a) {
      case "--help":
      case "-h":
        opts.help = true;
        break;
      case "--specialty":
        opts.specialty = next();
        break;
      case "--edition":
        opts.edition = next();
        break;
      case "--input":
        opts.input = next();
        break;
      case "--outdir":
        opts.outdir = next();
        break;
      case "--root":
        opts.root = next();
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--verbose":
        opts.verbose = true;
        break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return opts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  if (opts.help || process.argv.length <= 2) {
    printHelp();
    process.exit(opts.help ? 0 : 2);
  }

  const started = Date.now();
  try {
    const result = await convertCollege({
      ...opts,
      onProgress: opts.verbose
        ? (page, total) => {
            if (page === 1 || page === total || page % 25 === 0) {
              console.error(`extracting page ${page}/${total}`);
            }
          }
        : undefined,
    });

    if (result.validation.anomalies.length) {
      console.error("VALIDATION ANOMALIES (non-fatal):");
      for (const a of result.validation.anomalies) console.error(` - ${a}`);
    }
    if (result.warnings.length) {
      console.error(`WARNINGS: ${result.warnings.length} (see manifest.json)`);
    }

    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    if (opts.dryRun) {
      console.log(
        `DRY RUN PASS — ${result.manifest.stats.pages} pages, ${result.markdown.length} chars (${elapsed}s)`
      );
    } else {
      console.log(`CONVERT PASS — wrote ${result.paths.markdownPath}`);
      console.log(`MANIFEST     — wrote ${result.paths.manifestPath}`);
      console.log(
        `pages=${result.manifest.stats.pages} markdown_sha256=${result.manifest.markdown_sha256.slice(0, 12)}… (${elapsed}s)`
      );
    }
    process.exit(0);
  } catch (err) {
    console.error(err.message || err);
    if (err.validation?.errors?.length) {
      // already included in message
    }
    process.exit(1);
  }
}

main();
