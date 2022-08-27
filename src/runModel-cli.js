import runModel from "./awsPollenRunner";

// first argument is model name, second inputs

const [, , model, inputsString] = process.argv;

const inputs = JSON.parse(inputsString);

async function run(model, inputs) {
  const imageUrl = await runModel(inputs, model);
  console.log(imageUrl);
  // exit process
  process.exit(0);
}

run(model, inputs)