import runModel from "./awsModelRunner";

// first argument is model name, second inputs

const [, , model, inputsString] = process.argv;

const inputs = JSON.parse(inputsString);

async function run() {
  const imageUrl = await runModel(model, inputs);
  console.log(imageUrl);
}