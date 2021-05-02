import { updatePot, createRotaryKnob, createPedal, createInputSwitch, setKnob } from '../dom.js';
import { lerp, invlerp } from '../utils.js';

export const wahPedal = function(input, index) {
  // Default settings
  const defaults = {
    frequency: 1000,
    q: 1000,
    boost: 1.5,
    active: false,
    filterMin: 100,
    filterMax: 1500
  };

  // Create audio nodes
  const sum = ctx.createGain();
  const boost = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  const [output, toggle] = createInputSwitch(input, sum, defaults.active);

  // Set default values
  boost.gain.value = defaults.boost;
  filter.frequency.value = defaults.frequency;
  filter.type = 'bandpass';
  filter.q = defaults.q;
  filter.gain.value = -40;

  // Connect the nodes togther
  input.connect(boost);
  boost.connect(filter);
  filter.connect(sum);

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'wah',
    label: '.filter()',
    toggle,
    active: defaults.active,
    index
  });

  const $filter = createRotaryKnob({
    pedal,
    name: 'filter',
    label: 'Filter',
    min: defaults.filterMin,
    max: defaults.filterMax,
    step: 20,
    onInput: updatePot(filter.frequency),
    value: defaults.frequency
  });

  window.addEventListener('MIDIEXP', ({ detail }) => {
    const decimal = invlerp(0, 127, detail);
    const val = lerp(defaults.filterMin, defaults.filterMax, decimal);
    filter.frequency.value = val;
    setKnob($filter, 0, 127, detail);
  });

  createRotaryKnob({
    pedal,
    name: 'q',
    label: 'Q',
    min: 0.001,
    max: 1000,
    step: 10,
    onInput: updatePot(filter.q),
    value: defaults.q
  });

  createRotaryKnob({
    pedal,
    name: 'boost',
    label: 'Boost',
    max: 4,
    onInput: updatePot(boost.gain),
    value: defaults.boost
  });

  $pedalboard.appendChild(pedal);

  return output;
};