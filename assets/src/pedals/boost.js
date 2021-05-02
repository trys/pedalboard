import { updatePot, createRotaryKnob, createPedal, createInputSwitch } from '../dom.js';

export const boostPedal = function(input, index) {
  // Default settings
  const defaults = {
    gain: 1.5,
    active: false
  };

  // Create audio nodes
  const sum = ctx.createGain();
  const boost = ctx.createGain();

  const [output, toggle] = createInputSwitch(input, sum, defaults.active);

  // Set default values
  boost.gain.value = defaults.gain;

  // Connect the nodes togther
  input.connect(boost);
  boost.connect(sum);

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'boost',
    label: '!important',
    toggle,
    active: defaults.active,
    index
  });

  createRotaryKnob({
    pedal,
    name: 'boost',
    label: 'Boost',
    max: 3,
    onInput: updatePot(boost.gain),
    value: defaults.gain
  });

  $pedalboard.appendChild(pedal);

  return output;
};