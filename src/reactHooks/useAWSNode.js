import Debug from "debug";
import { useEffect, useState } from "react";
import { UploadInputstoIPFS } from "../aws.js";
import { dispatchPollen, subscribePollen, updatePollen } from "../supabase/pollen.js";
import useIPFS from "./useIPFS.js";
import useIPFSWrite from "./useIPFSWrite.js";


const debug = Debug("useAWSNode");

const LOADING_NODEID = "submitted";

const useAWSNode = ({ nodeID: paramsNodeID, contentID: paramsContentID } ) => {

    const [nodeID, setNodeID] = useState(paramsNodeID);
    const [queuePosition, setQueueNumber] = useState(-1);
    const [contentID, setContentID] = useState(paramsContentID);
    const ipfsWriter = useIPFSWrite();
    const ipfs = useIPFS(contentID);

    // set node ID to the node ID from URL
    useEffect(() => setNodeID(paramsNodeID), [paramsNodeID])

    // subscribe to content from node
    useEffect(() => {

        if (!nodeID || nodeID === LOADING_NODEID) return;

        debug("nodeID changed to", nodeID, ". (Re)subscribing");
        
        let closeSub = () => null;

        subscribePollen(nodeID, ({output}, queueNumber) => {
            setContentID(output);
            setQueueNumber(queueNumber);

        }).then(close => closeSub = close);

        return closeSub;

    }, [nodeID])

    const submitToAWSAndSetState = async (values, notebook, dev) => {
        setNodeID(LOADING_NODEID);
        const inputContentID = await UploadInputstoIPFS({...values, model_image: notebook}, ipfsWriter);
        debug("input content ID", inputContentID);
        dispatchPollen({input: inputContentID, image: notebook });
        setNodeID(inputContentID);
        setContentID(inputContentID);
        return { nodeID:inputContentID, contentID: inputContentID };
    }

    const isSubmitting = nodeID === LOADING_NODEID;

    // state is loading if it is submitting to AWS or if there is a nodeID but the output is not yet available
    const isLoading = isSubmitting || (nodeID && (!ipfs?.output?.done && ipfs?.output?.success !== false));

    return { 
        nodeID, 
        contentID, 
        setContentID, 
        connected: true, 
        submitToAWS: submitToAWSAndSetState, 
        setNodeID, 
        isLoading, 
        ipfs,
        updatePollen: data => updatePollen(nodeID, data),
        queuePosition
    }
};

export default useAWSNode
