
import Debug from "debug";
import { UploadInputstoIPFS } from './aws.js';
import { writer } from './ipfsConnector.js';
import { IPFSWebState } from './ipfsWebClient.js';
import { dispatchAndReturnPollen, dispatchPollen, dispatchPollenGenerator } from './supabase/pollen.js';

import { getPollens as getPollens1, updatePollen as updatePollen1 } from './supabase/pollen.js';
 
const debug = Debug("pollen");

// export async function* runModel (inputs, model="voodoohop/dalle-playground", executeOnDev=false)  {

// }

export const getPollens = getPollens1;
export const updatePollen = updatePollen1;

const runModelOnce = async (inputs, image="voodoohop/dalle-playground", returnImmediately=false, params={}) => {
  debug("running model", inputs, image);
  inputs = {...inputs, model_image:image};
  const inputCID = await UploadInputstoIPFS(inputs, writer());
  debug("got input content ID", inputCID);
  
  const outputCID = await dispatchAndReturnPollen({input: inputCID, image, ...params }, returnImmediately);
  if (!outputCID)
    return null;
  const data = await IPFSWebState(outputCID);
  debug("got and returning output data", data);

  if (!data?.output?.done) 
   throw new Error("output not done");

  return data;
}

export async function dispatch(inputs, image="voodoohop/dalle-playground", params={}) {
  const inputCID = await UploadInputstoIPFS({...inputs, model_image: image}, writer());
  await dispatchPollen({input: inputCID, image, ...params });
  return inputCID;
}

export async function* runModelGenerator(inputs, image="voodoohop/dalle-playground", params={}) {
  debug("running model", image);
  inputs = {...inputs, model_image:image};

  const inputCID = await UploadInputstoIPFS(inputs, writer());
  debug("got input content ID", inputCID);
  
  const pollenStream = await dispatchPollenGenerator({input: inputCID, image, ...params })

  for await (const contentID of pollenStream) {
    debug("got pollen data", contentID);
    const data = await IPFSWebState(contentID);
    yield data;
  }
}




export default runModelOnce;

