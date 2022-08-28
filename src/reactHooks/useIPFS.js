
import Debug from "debug";
import { useEffect, useState } from "react";
import { IPFSWebState } from "../ipfsWebClient.js";

const debug = Debug("useIPFS");

const useIPFS = (contentID, skipCache = false) => {
    const [ipfs, setIpfsState] = useState({});

    debug("ipfs state", ipfs);

    useEffect(() => {

        debug("setContentID", contentID);

        if (!ipfs || (contentID && contentID !== ipfs[".cid"])) {
            debug("dispatching new contentID", contentID);

            IPFSWebState(contentID, skipCache)
                .then(setIpfsState);
        }
    }, [contentID]);

    return ipfs;
};



export default useIPFS;


