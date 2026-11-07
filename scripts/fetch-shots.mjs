/*
 * Copies the screenshots used by the repository detail pages into assets/repos/.
 * Sources are files that already live in DwainSnickles' own repositories.
 *
 *   node scripts/fetch-shots.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const RAW = "https://raw.githubusercontent.com/DwainSnickles";

const SHOTS = [
  ["ribbon/ribbon.png", `${RAW}/RibbonWinForms/net10/docs/ribbon.png`],
  [
    "workshop/workshop.png",
    "https://user-images.githubusercontent.com/26853477/191587854-726c9a0c-cf80-4b60-9c3f-fbca20977270.png"
  ],
  ["motw/ui.png", `${RAW}/MOTW-Cleaner/master/images/page1.png`],
  ["motw/blocked.png", `${RAW}/MOTW-Cleaner/master/images/Blocked.png`],
  ["motw/completed.png", `${RAW}/MOTW-Cleaner/master/images/Completed.png`],
  // The MAUI player repository is a README-only walkthrough: its one image is a
  // GitHub user-attachment that does not resolve without a session, so that case
  // study renders the "no screenshot" panel instead.
  [
    "updater/creator.png",
    `${RAW}/AutoUpdater.NET.XML-Creator-master/master/AutoUpdaterTest/Resources/Screenshot%202023-03-01%20114109.png`
  ],
  [
    "updater/manifest.png",
    `${RAW}/AutoUpdater.NET.XML-Creator-master/master/AutoUpdaterTest/Resources/xml_featured.png`
  ]
];

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outDir = join(root, "assets", "repos");

let ok = 0;
for (const [file, url] of SHOTS) {
  const target = join(outDir, file);
  const response = await fetch(url, { headers: { "User-Agent": "dwainsnickles-site" } });
  if (!response.ok) {
    console.error(`✗ ${file} — HTTP ${response.status} from ${url}`);
    process.exitCode = 1;
    continue;
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  ok += 1;
  console.log(`✓ ${file}`);
}

console.log(`\n${ok}/${SHOTS.length} screenshots written to assets/repos/`);
