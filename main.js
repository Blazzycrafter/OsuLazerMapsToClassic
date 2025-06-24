/* ---------- Imports ---------- */
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import tmp from "tmp-promise";
import Realm from "realm";
import Fuse from "fuse.js";
import inquirer from "inquirer";
import autoPrompt from "inquirer-autocomplete-prompt";
import { createWriteStream } from "fs";
import archiver from "archiver";
import cliProgress from "cli-progress";

inquirer.registerPrompt("autocomplete", autoPrompt);
inquirer.registerPrompt(
  "checkbox-plus",
  (await import("inquirer-checkbox-plus-prompt")).default   // v1.3.0 für Inquirer 9
);

/* ---------- Hilfsfunktionen ---------- */
const sanitize = s => s.replace(/[:*?"<>|\\]/g, "_");

async function getOsuRootPath() {
  const def = path.join(process.env.APPDATA || "", "osu");
  const { osuRoot } = await inquirer.prompt([{
    type: "input",
    name: "osuRoot",
    message: "Pfad zum osu!-Benutzerordner:",
    default: def,
    validate: p => fssync.existsSync(p) ? true : "Ordner nicht gefunden"
  }]);
  return osuRoot;
}

async function openRealm(p) {
  return Realm.open({ path: p, schemaVersion: 48, readOnly: true });
}

function buildFuseIndex(realm) {
  const sets = realm.objects("BeatmapSet");
  const data = [];
  for (const s of sets) {
    const m = s.Beatmaps[0]?.Metadata;
    data.push({
      id: String(s.ID), onlineID: s.OnlineID,
      artist: m?.Artist, title: m?.Title
    });
  }
  return {
    sets,
    fuseData: data,
    fuse: new Fuse(data, { keys: ["title", "artist"], threshold: 0.35 })
  };
}

async function chooseSets(fuse, data) {
  return inquirer.prompt([{
    type: "checkbox-plus",
    name: "chosen",
    message: "Welche Sets exportieren?",
    pageSize: 10,
    searchable: true,
    source: async (_a, inp) => {
      const list = inp ? fuse.search(inp).map(r => r.item) : data;
      return list.map(i => ({
        name: `${i.artist} – ${i.title} (${i.onlineID})`,
        value: i.id
      }));
    }
  }]).then(r => r.chosen);
}

async function zipFlat(srcDir, zipFile) {
  await fs.mkdir(path.dirname(zipFile), { recursive: true });
  return new Promise((res, rej) => {
    const out = createWriteStream(zipFile);
    const zip = archiver("zip", { zlib: { level: 9 } });
    out.on("close", res);
    zip.on("error", rej);
    zip.pipe(out);
    zip.directory(srcDir, false);   // keine Oberordner
    zip.finalize();
  });
}

async function exportSet(set, filesRoot, exportDir) {
  const md   = set.Beatmaps[0]?.Metadata;
  const name = `${set.OnlineID} ${sanitize(md?.Artist)} - ${sanitize(md?.Title)}`;

  const { path: tempDir, cleanup } = await tmp.dir({ unsafeCleanup: true });
  const tgt = path.join(tempDir, name);
  await fs.mkdir(tgt, { recursive: true });

  const seen = new Set();
  for (const f of set.Files) {
    if (seen.has(f.Filename)) continue;
    seen.add(f.Filename);

    const hash = f.Hash ?? f.File?.Hash;
    const src  = path.join(filesRoot, hash[0], hash.slice(0,2), hash);
    const dst  = path.join(tgt, f.Filename);

    await fs.mkdir(path.dirname(dst), { recursive: true });
    await fs.copyFile(src, dst);             // Hard-Copy
  }

  const out = path.join(exportDir, `${name}.osz`);
  await zipFlat(tgt, out);
  await cleanup();
  return out;
}

/* ---------- Hauptlogik ---------- */
const osuRoot   = await getOsuRootPath();
const realmPath = path.join(osuRoot, "client.realm");
const filesRoot = path.join(osuRoot, "files");
const exportDir = path.join(osuRoot, "exports");
await fs.mkdir(exportDir, { recursive: true });

const realm     = await openRealm(realmPath);
const { fuse, fuseData, sets } = buildFuseIndex(realm);

console.log(`Insgesamt ${sets.length} Beatmap-Sets gefunden.`);

const { all } = await inquirer.prompt([{
  type: "confirm", name: "all",
  message: "Alle Beatmap-Sets exportieren?", default: false
}]);

let chosenIDs = [];
if (!all) chosenIDs = await chooseSets(fuse, fuseData);

const toExport = all
  ? sets
  : sets.filter(s => chosenIDs.includes(String(s.ID)));

const bar = new cliProgress.SingleBar({
  format: "Export |{bar}| {value}/{total} Sets",
  clearOnComplete: true
}, cliProgress.Presets.shades_classic);

bar.start(toExport.length, 0);

const success = [];
for (const s of toExport) {
  try {
    const out = await exportSet(s, filesRoot, exportDir);
    success.push(out);
  } catch (e) {
    console.error(`Fehler bei ${s.OnlineID}: ${e.message}`);
  }
  bar.increment();
}
bar.stop();

console.log("\nFertig! Erfolgreich exportiert nach " + exportDir);

realm.close();
process.exit(0);
