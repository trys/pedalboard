import { updatePot, createRotaryKnob, createPedal, createInputSwitchWithTails } from '../dom.js';

export const reverbPedal = function(input, index) {
  // Default settings
  const defaults = {
    mix: 0.35,
    tone: 4000,
    active: true
  };

  // Create audio nodes
  const reverb = ctx.createConvolver();
  const tone = ctx.createBiquadFilter();
  const mixIn = ctx.createGain();
  const mixOut = ctx.createGain();

  const [fxSend, fxReturn, output, toggle] = createInputSwitchWithTails(
    input,
    defaults.active
  );

  // Set default values
  mixIn.gain.value = 1 - defaults.mix;
  mixOut.gain.value = defaults.mix;
  tone.frequency.value = defaults.tone;

  // Connect the nodes togther
  fxSend.connect(mixIn);
  mixIn.connect(fxReturn);

  fxSend.connect(reverb);
  reverb.connect(tone);
  tone.connect(mixOut);
  mixOut.connect(fxReturn);

  reverb.buffer = buffer;

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'reverb',
    label: 'spacer.gif',
    toggle,
    active: defaults.active,
    index
  });

  createRotaryKnob({
    pedal,
    name: 'mix',
    label: 'Mix',
    max: 1,
    value: defaults.mix,
    onInput: event => {
      mixIn.gain.value = 1 - Number(event.target.value);
      mixOut.gain.value = Number(event.target.value);
    }
  });

  createRotaryKnob({
    pedal,
    name: 'tone',
    label: 'Tone',
    min: 200,
    max: 6000,
    step: 200,
    onInput: updatePot(tone.frequency),
    value: defaults.tone
  });

  $pedalboard.appendChild(pedal);

  return output;
};