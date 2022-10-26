import Debug from "debug";
import {
  createReadStream,
  existsSync
} from "fs";
import {
  dirname,
  join
} from "path";
import {
  groupWith
} from "ramda";
import chunkedFilewatcher from "./fileWatcher.js";

const debug = Debug("folderSync");

export default async function* folderSync({
  writer,
  path,
  debounce,
  signal
}) {
  const {
    add,
    mkDir,
    rm,
    cid
  } = writer;

  const addFile = async (ipfsPath, localPath) => {
    debug("Adding file", localPath, "to ipfs", ipfsPath);
    // get filename from path
    await add(ipfsPath, createReadStream(localPath))
  }


  debug("start consuming watched files");

  if (!existsSync(path)) {
    debug("Local: Root directory does not exist. Creating", path);
    mkdirSync(path, {
      recursive: true,
    });
  }

  const fileChanges$ = chunkedFilewatcher({
    path,
    debounce,
    signal,
  })

  for await (const changedFlat of fileChanges$) {
    // debug("Changed files", changedFlat);

    const changedGrouped = groupSyncQueue(changedFlat)

    debug("changedGrouped", changedGrouped)

    for (const changed of changedGrouped) {
      // Using sequential loop for now just in case parallel is dangerous with Promise.ALL
      for (const {
          event,
          path: file
        } of changed) {
          
        if (signal.aborted)
          continue

        debug("Local:", event, file);
        const localPath = join(path, file);
        const ipfsPath = file;

        if (event === "addDir") {
          debug("mkdir", ipfsPath);
          await mkDir(ipfsPath);
        }

        if (event === "add" || event === "change") {
          debug("adding", ipfsPath, localPath);
          await addFile(ipfsPath, localPath);
        }

        if (event === "unlink" || event === "unlinkDir") {
          debug("removing", file, event);
          await rm(ipfsPath);
        }
      }

    }

    const newContentID = await cid();

    yield newContentID;
  }
}


const groupKey = ({
  event,
  path
}) => dirname(path) + "_" + event;

const groupSyncQueue = groupWith(
  (a, b) => groupKey(a) === groupKey(b)
)