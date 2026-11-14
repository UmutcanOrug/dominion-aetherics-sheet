// Test-only upstream reference. Never added to git or the release ZIP.
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
const url="https://gitlab.com/peginc/swade/-/releases/v5.1.0/downloads/swade-v5.1.0.zip";
const response=await fetch(url);
if(!response.ok)throw new Error(`SWADE reference download: ${response.status}`);
const archive=new Uint8Array(await response.arrayBuffer());
const hash=createHash("sha256").update(archive).digest("hex");
const expected="df631eab4e09d6309d8ffe7a9966407c00ecd1b6c0a6987beab4e6bc51d157b3";
if(hash!==expected)throw new Error(`SWADE v5.1.0 reference checksum changed: ${hash}`);
const files=unzipSync(archive);
for(const name of ["system.json","templates/actors/character/tabs/powers.hbs"]){
  if(!files[name])throw new Error(`Missing reference ${name}`);
  const destination=".reference/runtime/"+name;
  await fs.mkdir(destination.slice(0,destination.lastIndexOf("/")),{recursive:true});
  await fs.writeFile(destination,files[name]);
}
console.log(`Verified upstream SWADE v5.1.0 reference: ${hash}`);
