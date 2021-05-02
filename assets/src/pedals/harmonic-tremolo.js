import { createRotaryKnob, createPedal, createInputSwitch } from '../dom.js';

export const harmonicTremoloPedal = function(input, index) {
  // Default settings
  const defaults = {
    active: false,
    speed: 4.4,
    depth: 0.54
  };

  const finalOutput = ctx.createGain();
  const [output, toggle] = createInputSwitch(input, finalOutput, defaults.active);
  
  // Create audio nodes
  const passThrough = ctx.createGain();
  const sum = ctx.createGain();

  passThrough.gain.value = 1 - defaults.depth;
  sum.gain.value = defaults.depth;

  // High pass
  const highPass = ctx.createBiquadFilter();
  const highPassOut = ctx.createGain();
  const highPassOsc = ctx.createOscillator();

  highPass.type = 'highpass';
  highPass.frequency.value = 4000;
  highPassOsc.frequency.value = defaults.speed;

  // Low pass
  const lowPass = ctx.createBiquadFilter();
  const lowPassOut = ctx.createGain();
  const lowPassPhase = ctx.createGain();
  const lowPassOsc = ctx.createOscillator();
  lowPass.frequency.value = 800;
  lowPass.type = 'lowpass'
  lowPassPhase.gain.value = -1;
  lowPassOsc.frequency.value = defaults.speed;
  lowPassOsc.detune.value = -180;

  // Connect the nodes
  // Oscillator
  lowPassOsc.connect(lowPassOut.gain)
  lowPassOsc.start()
  highPassOsc.connect(highPassOut.gain)
  highPassOsc.start()

  // Pass through
  input.connect(passThrough)
  passThrough.connect(finalOutput)

  // High pass
  input.connect(highPass)
  highPass.connect(highPassOut)
  highPassOut.connect(sum)

  // Low pass
  input.connect(lowPass)
  lowPass.connect(lowPassPhase)
  lowPassPhase.connect(lowPassOut)
  lowPassOut.connect(sum)

  sum.connect(finalOutput)

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'harmonic tremolo',
    label: 'rotate(180deg)',
    toggle,
    active: defaults.active,
    index
  });

  createRotaryKnob({
    pedal,
    name: 'speed',
    label: 'Speed',
    max: 8,
    value: defaults.speed,
    onInput: event => {
      const val = Number(event.target.value);
      lowPassOsc.frequency.value = val;
      highPassOsc.frequency.value = val;
    }
  })

  createRotaryKnob({
    pedal,
    name: 'depth',
    label: 'Depth',
    value: defaults.depth,
    onInput: event => {
      const val = Number(event.target.value);
      passThrough.gain.value = 1 - val;
      sum.gain.value = val;
    }
  })

  $pedalboard.appendChild(pedal);

  return output;
};