import { updatePot, createRotaryKnob, createPedal, createSwitch, createInputSwitch } from '../dom.js';

export const tremoloPedal = function(input, index) {
  // Default settings
  const defaults = {
    speed: 3,
    depth: 0.3,
    wave: 'sine',
    active: false
  };

  // Create audio nodes
  const sum = ctx.createGain();
  const lfo = ctx.createOscillator();
  const tremolo = ctx.createGain();
  const depthIn = ctx.createGain();
  const depthOut = ctx.createGain();

  const [output, toggle] = createInputSwitch(input, sum, defaults.active);

  // Set default values
  lfo.frequency.value = defaults.speed;
  depthIn.gain.value = 1 - defaults.depth;
  depthOut.gain.value = defaults.depth;

  // Connect the nodes togther
  lfo.connect(tremolo.gain);
  lfo.start();
  input.connect(tremolo);
  tremolo.connect(depthOut);
  depthOut.connect(sum);
  input.connect(depthIn);
  depthIn.connect(sum);

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'tremolo',
    label: '&lt;blink /&gt;',
    toggle,
    active: defaults.active,
    index
  });

  createRotaryKnob({
    pedal,
    name: 'speed',
    label: 'Speed',
    max: 4,
    onInput: updatePot(lfo.frequency),
    value: defaults.speed
  });

  createRotaryKnob({
    pedal,
    name: 'depth',
    label: 'Depth',
    value: defaults.depth,
    onInput: event => {
      depthIn.gain.value = 1 - Number(event.target.value);
      depthOut.gain.value = Number(event.target.value);
    }
  });

  createSwitch({
    pedal,
    name: 'wave',
    label: 'Wave',
    value: defaults.wave,
    onInput: updatePot(lfo.type),
    options: [
      { label: 'Sine', value: 'sine' },
      { label: 'Square', value: 'square' },
      { label: 'Sawtooth', value: 'sawtooth' },
      { label: 'Triangle', value: 'triangle' }
    ]
  });

  $pedalboard.appendChild(pedal);

  return output;
};