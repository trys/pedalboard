import { updatePot, createRotaryKnob, createPedal, createInputSwitchWithTails } from '../dom.js';

export const delayPedal = function(input, index) {
  // Default settings
  const defaults = {
    tone: 3200,
    speed: 0.45,
    mix: 0.3,
    feedback: 0.4,
    active: true,
    maxDelay: 1.5
  };

  // Create audio nodes
  const delayGain = ctx.createGain();
  const feedback = ctx.createGain();
  const delay = ctx.createDelay(defaults.maxDelay);
  const filter = ctx.createBiquadFilter();

  const [fxSend, fxReturn, output, toggle] = createInputSwitchWithTails(
    input,
    defaults.active
  );

  // Set default values
  delay.delayTime.value = defaults.speed;
  feedback.gain.value = defaults.feedback;
  delayGain.gain.value = defaults.mix;
  filter.frequency.value = defaults.tone;

  // Connect the nodes togther
  fxSend.connect(fxReturn);
  fxSend.connect(filter);
  filter.connect(delay);
  delay.connect(feedback);
  delay.connect(delayGain);
  feedback.connect(delay);
  delayGain.connect(fxReturn);

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'delay',
    label: 'setTimeout',
    toggle,
    active: defaults.active,
    index
  });

  createRotaryKnob({
    pedal,
    name: 'mix',
    label: 'Mix',
    onInput: updatePot(delayGain.gain),
    value: defaults.mix
  });

  createRotaryKnob({
    pedal,
    name: 'feedback',
    label: 'Feedback',
    max: 0.7,
    onInput: updatePot(feedback.gain),
    value: defaults.feedback
  });

  createRotaryKnob({
    pedal,
    name: 'speed',
    label: 'Speed',
    max: defaults.maxDelay,
    onInput: updatePot(delay.delayTime),
    value: defaults.speed
  });

  createRotaryKnob({
    pedal,
    name: 'tone',
    label: 'Tone',
    min: 200,
    max: 6000,
    step: 200,
    onInput: updatePot(filter.frequency),
    value: defaults.tone
  });

  $pedalboard.appendChild(pedal);

  return output;
};