
import Debug from "debug";
import fetch from "node-fetch";
import { dispatchAndReturnPollen } from "./supabase/pollen.js";

export { getPollen, getPollens, updatePollen } from './supabase/pollen.js';
export { default as getWebURL } from "./utils/getWebURL.js";

const debug = Debug("ipfsWebClient")

const host = "https://store.pollinations.ai"
// Return IPFS state. Converts all JSON/text content to objects and binary cids to URLs.
export const IPFSWebState = async contentID => {
    debug("Getting state for CID", contentID)
    const url = contentID.startsWith("/") ? `${host}${contentID}` : `${host}/ipfs/${contentID}`
    const response = await fetch(url);
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
        body: JSON.stringify({input: inputs}),
        headers: { "Content-Type":"application/json" }
    });
    
    const cid = await response.text();
    debug("cid after adding inputs", cid)
    return cid
}



export const runModel = async (inputs, image="voodoohop/dalle-playground", returnImmediately=false, params={}) => {
    debug("running model", inputs, image);
    inputs = {...inputs, model_image: image};
    const inputCID = await updateInput(inputs);
    debug("got input content ID", inputCID);
    
    const outputCID = await dispatchAndReturnPollen({input: inputCID.toString(), image, ...params }, returnImmediately);
    if (!outputCID)
      return null;
    const data = await IPFSWebState(outputCID);
    debug("got and returning output data", data);
  
    // if (!data?.output?.done) 
    //  throw new Error("output not done");
  
    return data;
  }