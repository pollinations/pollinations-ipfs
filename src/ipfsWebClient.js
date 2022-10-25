
import Debug from "debug";
import fetch from "node-fetch";

export { getPollens, updatePollen } from './supabase/pollen.js';
export { default as getWebURL } from "./utils/getWebURL.js";

const debug = Debug("ipfsWebClient")

const host = "https://store.pollinations.ai"
// Return IPFS state. Converts all JSON/text content to objects and binary cids to URLs.
export const IPFSWebState = async contentID => {
    debug("Getting state for CID", contentID)
    const response = await fetch(`${host}/ipfs/${contentID}`);
    const json = await response.json();
    debug("Got state", json);
    return json;
}

// export const getWriter = cid => {
//     debug("getting input writer for cid", cid);
//     const w = writer(cid);

//     // try to close the writer when window is closed
//     const previousUnload = window.onbeforeunload;
//     window.onbeforeunload = () => {
//         previousUnload && previousUnload();
//         w.close();
//         return undefined;
//     };

//     return w;
// }

// Update /input of ipfs state with new inputs (from form probably)
export const updateInput = async inputs => {
    debug("updateInput", inputs);
    // POST JSON to host
    const response = await fetch(host, {
        method: "POST",
        body: inputs
    });
    
    const cid = await response.text();
    debug("cid after adding inputs", cid)
    return cid
}

// only download json files, notebooks and files without extension (such as logs, text, etc)
function shouldImport(ext) {
    return ext.length === 0 || ext.toLowerCase() === ".json" || ext.toLowerCase() === ".ipynb" || ext.toLowerCase() === ".md";
}
