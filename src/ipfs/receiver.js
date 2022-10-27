import Debug from 'debug';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from "path";
import { subscribeGenerator } from '../ipfsPubSub.js';
import { getIPFSState } from '../ipfsState.js';


const debug = Debug("ipfs/receiver");

  

// Fetch the IPFS state and write to disk  
export async function processRemoteCID(contentID, rootPath) {
  // if (isSameContentID(stringCID(contentID)))
  //   return;
  debug("Processing remote CID", contentID);
    
  const ipfsState = (await getIPFSState(contentID, (file) => processFile(file, rootPath)));
  debug("got remote state", ipfsState);
}

// Receives a stream of updates from IPFS pubsub or stdin and writes them to disk
export const receive = async function* ({ subfolder, nodeid, path: rootPath }, process=processRemoteCID) {
  // subscribe to content id updates either via IPNS or stdin

  const [cidStream, unsubscribe] = subscribeGenerator(nodeid)
   

  for await (let receivedCID of await cidStream) {
    await process(receivedCID + subfolder, rootPath);
  }

  unsubscribe()
  return remoteCID;
};


export const writeFileAndCreateFolder = async (path, content) => {
    debug("creating folder if it does not exist", dirname(path));
    mkdirSync(dirname(path), { recursive: true });
    debug("writing file of length", content.size, "to folder", path);
    writeFileSync(path, content);
    return path;
  };


// Writes all files to disk coming from the IPFS state
async function processFile({ path, cid, buffer }, rootPath) {
  debug("processing file", path, cid, rootPath);
  const _debug = debug.extend(`processFile(${path})`);
  _debug("started");
  const destPath = join(rootPath, path);
  _debug("writeFile", destPath, cid, "queued");

  // queue.add(async () => {
  const content = await buffer();
  _debug("writefile content", content.length);
  await writeFileAndCreateFolder(destPath, content);
  _debug("done");
  // });
  return destPath;
}

