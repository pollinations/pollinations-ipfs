import { program } from "commander";
import Debug from "debug";
import runModel, { dispatch } from "./awsPollenRunner";
import { processRemoteCID } from "./ipfs/receiver";
// import library to get mimetype from file extension
import { readFileSync } from "fs";
import { lookup } from "mime-types";

const debug = Debug("runModel-cli");

 program
    .option('-m, --model <model>', 'model image identifier to run',  "614871946825.dkr.ecr.us-east-1.amazonaws.com/pollinations/stable-diffusion-private")
    .option('-i --input <json>', 'input json', "{}")
    .option('-o --output-path <path>', 'save output to path', null)
    .option('-r, --return', 'just schedule run and return CID immediately', false)
    .option('-p, --priority <priority>', 'priority of run', 0)


async function main() {

  program.parse(process.argv);


  const opts = program.opts();
  
  debug("options", opts)
  
  const { input, outputPath, return: onlyDispatch, priority, model } = opts;
  
  const inputObject = encodeFiles(JSON.parse(input));
  debug("encoded input object", inputObject)
  await run(model, inputObject, onlyDispatch, priority, outputPath)
  
}
    

async function run(model, inputs, onlyDispatch, priority, outputPath) {
  if (onlyDispatch) {
    const inputCid = await dispatch(inputs, model, { priority });
    console.log(inputCid);
    return inputCid;
  }
  const resultJSON = await runModel(inputs, model, false, { priority });
  console.log(JSON.stringify(resultJSON));
  if (outputPath) {
    await processRemoteCID(resultJSON.output[".cid"], outputPath);
  }
  // exit process
  process.exit(0);
}



// all values in object that start with an @ reference a file
// this function recursively iterates the object and encodes them to base64 adding the data: prefix

function encodeFiles(obj) {
  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    result[key] = value;
    if (typeof value === "string" && value.startsWith("@")) {
      const path = value.slice(1);
      const data = readFileSync(path);
      const base64 = data.toString("base64");
      const mimeType = lookup(path);
      result[key] = `data:${mimeType};base64,${base64}`;
    } else if (typeof value === "object") {
      result[key] = encodeFiles(value);
    }
  })
  return result;
}


main()