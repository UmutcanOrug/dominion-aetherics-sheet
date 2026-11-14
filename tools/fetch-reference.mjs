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

const toolsCommit="24de3c15f7b9de79c0114862bd519706b58f7197";
const toolsResponse=await fetch(`https://raw.githubusercontent.com/UmutcanOrug/swade-tools-fix/${toolsCommit}/scripts/st.js`);
if(!toolsResponse.ok)throw new Error(`SWADE Tools reference download: ${toolsResponse.status}`);
const toolsSource=(await toolsResponse.text()).replaceAll("\r\n","\n").trimEnd()+"\n";
const toolsHash=createHash("sha256").update(toolsSource).digest("hex");
if(toolsHash!=="240041f8effbfb94b793380005372e47356539a41d77b3c78a10738bf74f58b3")throw new Error(`SWADE Tools reference checksum changed: ${toolsHash}`);
await fs.mkdir(".reference/swade-tools",{recursive:true});
await fs.writeFile(".reference/swade-tools/st.js",toolsSource);
console.log(`Verified swade-tools-fix 2.2.4 API reference: ${toolsCommit}`);
