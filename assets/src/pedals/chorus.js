import { createRotaryKnob, createPedal, createInputSwitch, updatePot } from '../dom.js';

export const chorusPedal = function(input, index) {
  // Default settings
  const defaults = {
    mix: 0.3,
    depth: 0.001,
    rate: 1.3,
    active: true
  };

  // Create audio nodes
  const sum = ctx.createGain();

  const mixIn = ctx.createGain();
  const mixOut = ctx.createGain();

  const [output, toggle] = createInputSwitch(input, sum, defaults.active);

  // Set default values
  mixIn.gain.value = 1 - defaults.mix;
  mixOut.gain.value = defaults.mix;

  const chorus1Delay = ctx.createDelay();
  const chorus1Sum = ctx.createGain();
  const chorus1LFO = ctx.createOscillator();
  const chorus1LFOGain = ctx.createGain();

  chorus1LFO.type = 'sine';
  chorus1Delay.delayTime.value = 0.01;
  chorus1LFOGain.gain.value = defaults.depth;
  chorus1LFO.frequency.setValueAtTime(defaults.rate, ctx.currentTime);
  chorus1LFO.start(0);

  input.connect(chorus1Delay)
  chorus1Delay.connect(chorus1Sum);
  chorus1LFO.connect(chorus1LFOGain);
  chorus1LFOGain.connect(chorus1Delay.delayTime);
  chorus1Sum.connect(mixOut);
  mixOut.connect(sum);
  
  input.connect(mixIn);
  mixIn.connect(sum);
  

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'chorus',
    label: 'float',
    toggle,
    active: defaults.active,
    index
  });

  createRotaryKnob({
    pedal,
    name: 'depth',
    label: 'Depth',
    min: 0.0000005,
    max: 0.005,
    step: 0.0001,
    onInput: updatePot(chorus1LFOGain.gain),
    value: defaults.depth
  });

  createRotaryKnob({
    pedal,
    name: 'rate',
    label: 'Rate',
    min: 0,
    max: 4,
    step: 0.1,
    onInput: updatePot(chorus1LFO.frequency),
    value: defaults.rate
  });

  createRotaryKnob({
    pedal,
    name: 'mix',
    label: 'Mix',
    max: 0.5,
    value: defaults.mix,
    onInput: event => {
      mixIn.gain.value = 1 - Number(event.target.value);
      mixOut.gain.value = Number(event.target.value);
    }
  });

  $pedalboard.appendChild(pedal);

  return output;
};
