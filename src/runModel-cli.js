import runModel, { dispatch } from "./awsPollenRunner";

// first argument is model name, second inputs

const [, , model, inputsString, stringPriority="1"] = process.argv;


const priority = parseInt(stringPriority);
const inputs = JSON.parse(inputsString);

const onlyDispatch = false;

async function run(model, inputs) {
  if (onlyDispatch) {
    const inputCid = await dispatch(inputs, model, { priority });
    console.log(inputCid);
    return inputCid;
  }
  const imageUrl = await runModel(inputs, model, false, { priority });
  console.log(imageUrl);
  // exit process
  process.exit(0);
}

run(model, inputs)