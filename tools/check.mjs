import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import Handlebars from "handlebars";

const manifest = JSON.parse(await fs.readFile("module.json","utf8"));
const pkg = JSON.parse(await fs.readFile("package.json","utf8"));
assert.equal(manifest.id,"dominion-aetherics-sheet");
assert.equal(manifest.version,pkg.version);
assert.equal(manifest.compatibility.maximum,"13");
assert.equal(manifest.compatibility.verified,"13.351");
assert.equal(manifest.relationships.systems[0].compatibility.maximum,"5.1.0");
assert.equal(manifest.relationships.recommends.find(r=>r.id==="swade-tools").manifest,"https://github.com/UmutcanOrug/swade-tools-fix/releases/latest/download/module.json");
const repository = "https://github.com/UmutcanOrug/dominion-aetherics-sheet";
assert.equal(manifest.manifest,`${repository}/releases/latest/download/module.json`);
assert.equal(manifest.download,`${repository}/releases/download/v${manifest.version}/module.zip`);
for (const file of [...manifest.esmodules,...manifest.styles,...manifest.languages.map(lang=>lang.path),"LICENSE","README.md"]) await fs.access(file);
async function files(dir) {
  return (await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]))).flat();
}
const english=JSON.parse(await fs.readFile("lang/en.json","utf8")).DA;
const turkish=JSON.parse(await fs.readFile("lang/tr.json","utf8")).DA;
assert.deepEqual(Object.keys(english).sort(),Object.keys(turkish).sort(),"Localization keys must match");
const code = [];
for (const file of await files("scripts")) {
  if (!file.endsWith(".js")) continue;
  const result=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
  if(result.status!==0)throw new Error(result.stderr);
  const source=await fs.readFile(file,"utf8"); code.push(source);
  for(const match of source.matchAll(/\bt\("([A-Za-z]+)"/g))assert.ok(english[match[1]],`Missing translation ${match[1]}`);
}
for(const file of await files("templates")) {
  const source=await fs.readFile(file,"utf8"); Handlebars.precompile(source);
  for(const match of source.matchAll(/localize\s+["']DA\.([A-Za-z]+)["']/g))assert.ok(english[match[1]],`Missing translation ${match[1]}`);
}
const source=code.join("\n");
assert.doesNotMatch(source,/unregisterSheet\s*\(/);
assert.doesNotMatch(source,/\beval\s*\(|new\s+Function\s*\(/);
assert.match(source,/makeDefault:\s*false/);
console.log(`Validated manifest, ${manifest.version}, module syntax, templates and both localizations.`);
