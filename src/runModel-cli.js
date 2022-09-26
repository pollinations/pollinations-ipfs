import runModel, { dispatch } from "./awsPollenRunner";

// first argument is model name, second inputs

const [, , model, inputsString, onlyDispatch] = process.argv;

const inputs = JSON.parse(inputsString);

async function run(model, inputs) {
  if (onlyDispatch) {
    const inputCid = await dispatch(inputs, model, { priority: 1});
    console.log(inputCid);
    return inputCid;
  }
  const imageUrl = await runModel(inputs, model, false, { priority: 1 });
  console.log(imageUrl);
  // exit process
  process.exit(0);
}

run(model, inputs)