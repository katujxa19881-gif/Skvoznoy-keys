import fs from "fs";

async function fetchDoc() {
  const url = "https://docs.google.com/document/d/1EnpcFuncUolrCwsspXCKEmNknGKugLc1GUFBhdXx-NY/export?format=txt";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch doc: ${res.statusText}`);
    }
    const text = await res.text();
    fs.writeFileSync("./doc-content.txt", text, "utf-8");
    console.log("SUCCESS");
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

fetchDoc();
