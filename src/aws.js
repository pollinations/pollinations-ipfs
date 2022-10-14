import Debug from "debug";
import { importJSON } from "./pollenStoreClient";

const debug = Debug("Aws.js");


export async function UploadInputstoIPFS(values){
  debug("adding values to ipfs", values)

  return await importJSON(values)

}