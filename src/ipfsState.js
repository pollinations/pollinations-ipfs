

import Debug from "debug";
import json5 from "json5";
import path from "path-browserify";
import { exportCID } from "./pollenStoreClient.js";

const { join } = path;
const { parse } = json5;

const debug = Debug("ipfsState");


// The callback is called for each file in the directories which can fetch or process them further
export const getIPFSState = async (contentID, callback=f=>f) => {
    debug("Getting state for CID", contentID)
    return await exportCID(contentID, callback)
}
