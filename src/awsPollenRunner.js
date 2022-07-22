
import { submitToAWS, UploadInputstoIPFS } from './aws.js';
import { writer } from './ipfsConnector.js';
import { subscribeGenerator } from './ipfsPubSub.js';
import { IPFSWebState } from './ipfsWebClient.js';
import { dispatchAndReturnPollen } from './supabase/pollen.js';
import Debug from "debug"

const debug = Debug("awsPollenRunner");

// export async function* runModel (inputs, model="voodoohop/dalle-playground", executeOnDev=false)  {

// }



const runModelOnce = async (inputs, image="voodoohop/dalle-playground",) => {
  debug("running model", inputs, image);

  const inputCID = await UploadInputstoIPFS(inputs, writer());
  debug("got input content ID", inputCID);
  
  const outputCID = await dispatchAndReturnPollen({input: inputCID, image});
  const data = await IPFSWebState(outputCID);
  debug("got and returning output data", data);

  return data;
}



export default runModelOnce;

