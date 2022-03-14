import { updatePot, createRotaryKnob, createPedal, createInputSwitch } from '../dom.js';

export const compressorPedal = function(input, index) {
  // Default settings
  const defaults = {
    mix: 0.85,
    threshold: -30,
    attack: 0.1,
    release: 0.5,
    active: true
  };

  // Create audio nodes
  const sum = ctx.createGain();
  const mixIn = ctx.createGain();
  const mixOut = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();

  const [output, toggle] = createInputSwitch(input, sum, defaults.active);

  // Set default values
  compressor.threshold.value = defaults.threshold;
  compressor.attack.value = defaults.attack;
  compressor.release.value = defaults.release;
  mixIn.gain.value = 1 - defaults.mix;
  mixOut.gain.value = defaults.mix;

  // Connect the nodes togther
  input.connect(compressor);
  compressor.connect(mixOut);
  mixOut.connect(sum);
  input.connect(mixIn);
  mixIn.connect(sum);

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'compressor',
    label: 'Smoosh',
    toggle,
    active: defaults.active,
    index
  });

  createRotaryKnob({
    pedal,
    name: 'mix',
    label: 'Mix',
    value: defaults.mix,
    onInput: event => {
      mixIn.gain.value = 1 - Number(event.target.value);
      mixOut.gain.value = Number(event.target.value);
    }
  });

  createRotaryKnob({
    pedal,
    min: -100,
    max: 0,
    name: 'threshold',
    label: 'Threshold',
    value: defaults.threshold,
    onInput: updatePot(compressor.threshold)
  });

  createRotaryKnob({
    pedal,
    name: 'attack',
    label: 'Attack',
    value: defaults.attack,
    onInput: updatePot(compressor.attack)
  });

  createRotaryKnob({
    pedal,
    name: 'release',
    label: 'Release',
    value: defaults.release,
    onInput: updatePot(compressor.release)
  });

  $pedalboard.appendChild(pedal);

  return output;
};