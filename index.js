#!/usr/bin/env node

require('./src/ImageSequencer');
sequencer = ImageSequencer({ui: false});

var program = require('commander');
var readlineSync = require('readline-sync');

function exit(message) {
  console.error(message);
  process.exit(1);
}

program
  .version('0.1.0')
  .option('-i, --image [PATH/URL]', 'Input image URL')
  .option('-s, --step [step-name]', 'Name of the step to be added.')
  .option('-o, --output [PATH]', 'Directory where output will be stored.')
  .option('-b, --basic','Basic mode outputs only final image')
  .option('-op, --opions {object}', 'Options for the step')
  .parse(process.argv);

// Parse step into an array to allow for multiple steps.
program.step = program.step.split(" ");

// User must input an image.
if(!program.image) exit("Can't read file.")

// User must input an image.
require('fs').access(program.image, function(err){
  if(err) exit("Can't read file.")
});

// User must input a step. If steps exist, check that every step is a valid step.
if(!program.step || !validateSteps(program.step))
  exit("Please ensure all steps are valid.");

// If there's no user defined output directory, select a default directory.
program.output = program.output || "./output/";

// Set sequencer to log module outputs, if any.
sequencer.setUI({

  onComplete: function(step) {

    // Get information of outputs.
    step.info = sequencer.modulesInfo(step.name);

    for (var output in step.info.outputs) {
      console.log("["+program.step+"]: "+output+" = "+step[output]);
    }

  }

});

// Finally, if everything is alright, load the image, add the steps and run the sequencer.
sequencer.loadImages(program.image,function(){
    console.warn('\x1b[33m%s\x1b[0m', "The execution will be async\nYou may not see the output for a few seconds or minutes")

    if(program.basic) console.log("Basic mode is enabled, outputting only final image")

  // Iterate through the steps and retrieve their inputs.
  program.step.forEach(function(step){
    var options = Object.assign({}, sequencer.modulesInfo(step).inputs);

    // If inputs exists, print to console.
    if (Object.keys(options).length) {
      console.log("[" + step + "]: Inputs");
    }

    // If inputs exists, print them out with descriptions.
    Object.keys(options).forEach(function(input) {
        // The array below creates a variable number of spaces. This is done with (length + 1). 
        // The extra 4 that makes it (length + 5) is to account for the []: characters
        console.log(new Array(step.length + 5).join(' ') + input + ": " + options[input].desc);
    });

    // If inputs exist, iterate through them and prompt for values.
    Object.keys(options).forEach(function(input) {
        var value = readlineSync.question("[" + step + "]: Enter a value for " + input + " (" + options[input].type + ", default: " + options[input].default + "): ");
        options[input] = value;
    });

    // Add the step and its inputs to the sequencer.
    sequencer.addSteps(step, options);
  });

  // Run the sequencer.
  sequencer.run(function(){

    // Export all images or final image as binary files.
    sequencer.exportBin(program.output,program.basic);

    console.log("Files will be exported to \""+program.output+"\"");

  });

});

// Takes an array of steps and checks if they are valid steps for the sequencer.
function validateSteps(steps) {

  // Assume all are valid in the beginning. 
  var valid = true;
  steps.forEach(function(step) {
    // If any step in the array is not valid (not a property of modulesInfo), set valid to false.
    if (!sequencer.modulesInfo().hasOwnProperty(step)) {
      valid = false;
    }
  });

  // Return valid. (If all of the steps are valid properties, valid will have remained true).
  return valid;
}