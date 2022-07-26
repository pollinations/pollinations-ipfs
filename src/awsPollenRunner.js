
import { submitToAWS, UploadInputstoIPFS } from './aws.js';
import { writer } from './ipfsConnector.js';
import { IPFSWebState } from './ipfsWebClient.js';
import { dispatchAndReturnPollen, dispatchPollenGenerator } from './supabase/pollen.js';
import Debug from "debug"

const debug = Debug("awsPollenRunner");

// export async function* runModel (inputs, model="voodoohop/dalle-playground", executeOnDev=false)  {

// }



const runModelOnce = async (inputs, image="voodoohop/dalle-playground") => {
  debug("running model", inputs, image);

  const inputCID = await UploadInputstoIPFS(inputs, writer());
  debug("got input content ID", inputCID);
  
  const outputCID = await dispatchAndReturnPollen({input: inputCID, image});
  const data = await IPFSWebState(outputCID);
  debug("got and returning output data", data);

  if (!data?.output?.done) 
   throw new Error("output not done");

  return data;
}


export async function* runModelGenerator(inputs, image="voodoohop/dalle-playground") {
  debug("running model", image);

  const inputCID = await UploadInputstoIPFS(inputs, writer());
  debug("got input content ID", inputCID);
  
  const pollenStream = dispatchPollenGenerator({input: inputCID, image})

  for await (const {output:contentID} of pollenStream) {
    debug("got pollen data", contentID);
    const data = await IPFSWebState(contentID);
    yield data;
  }
}


export default runModelOnce;

