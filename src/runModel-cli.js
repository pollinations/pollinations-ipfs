import { program } from "commander";
import Debug from "debug";
import runModel, { dispatch } from "./awsPollenRunner";
import { processRemoteCID } from "./ipfs/receiver";

const debug = Debug("runModel-cli");

 program
    .option('-m, --model <model>', 'model image identifier to run',  "614871946825.dkr.ecr.us-east-1.amazonaws.com/pollinations/stable-diffusion-private")
    .option('-i --input <json>', 'input json', "{}")
    .option('-o --output-path <path>', 'save output to path', null)
    .option('-r, --return', 'just schedule run and return CID immediately', false)
    .option('-p, --priority <priority>', 'priority of run', 0)



program.parse(process.argv);


const opts = program.opts();

debug("options", opts)

const { input, outputPath, return: onlyDispatch, priority, model } = opts;

const inputObject = JSON.parse(input);


async function run(model, inputs, onlyDispatch) {
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

run(model, inputObject, onlyDispatch)