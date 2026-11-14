import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { zipSync, unzipSync } from "fflate";
import "./check.mjs";

const roots=["module.json","scripts","templates","styles","lang","README.md","LICENSE","CHANGELOG.md","docs"];
const entries={};
async function add(file) {
  const stat=await fs.stat(file);
  if(stat.isDirectory()) { for(const name of (await fs.readdir(file)).sort()) await add(path.join(file,name)); return; }
  entries[file.replaceAll("\\","/")]=[new Uint8Array(await fs.readFile(file)),{mtime:new Date(2000,0,1,0,0,0)}];
}
for(const file of roots)await add(file);
const zip=zipSync(entries,{level:9});
const unpacked=unzipSync(zip);
assert.ok(unpacked["module.json"]);
assert.equal(JSON.parse(new TextDecoder().decode(unpacked["module.json"])).id,"dominion-aetherics-sheet");
for(const name of Object.keys(unpacked))assert.ok(!name.startsWith(".")&&!/node_modules|\.reference|package-lock|tests\//.test(name));
await fs.mkdir("dist",{recursive:true});
await fs.writeFile("dist/module.zip",zip);
await fs.copyFile("module.json","dist/module.json");
const sums=[];
for(const name of ["module.json","module.zip"])sums.push(`${createHash("sha256").update(await fs.readFile("dist/"+name)).digest("hex")}  ${name}`);
await fs.writeFile("dist/SHA256SUMS.txt",sums.join("\n")+"\n");
console.log(`Built dist/module.zip: ${Object.keys(unpacked).length} files, ${zip.length} bytes; manifest at ZIP root.`);
