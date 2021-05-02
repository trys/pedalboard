import { updatePot, createRotaryKnob, createPedal, createInputSwitchWithTails, createToggle, setKnob } from '../dom.js';
import { lerp, invlerp } from '../utils.js';

export const multiHeadDelay = function(input, index) {
  // Default settings
  const defaults = {
    lows: -1,
    highs: 1,
    speed: 0.45,
    mix: 0.3,
    feedback: 0.5,
    active: true,
    maxDelay: 1.5,
    filter: 'highpass',
    depth: 0.0005,
    rate: 0.5
  };

  const [fxSend, fxReturn, output, toggle] = createInputSwitchWithTails(
    input,
    defaults.active
  );

  function createSubPedal(parent, name = '') {
    const subPedal = document.createElement('li');
    subPedal.dataset.type = name;
    subPedal.classList.add('sub-pedal');
    subPedal.classList.add('sub-pedal-' + name.toLowerCase());
    parent.appendChild(subPedal);

    return subPedal;
  }

  function createDelayHead(fxSend, fxReturn, panValue, delayTime, feedbackValue) {
    // Create audio nodes
    const input = ctx.createGain();
    const delaySum = ctx.createGain();
    const feedback = ctx.createGain();
    const delay = ctx.createDelay(defaults.maxDelay);
    const lowFilter = ctx.createBiquadFilter();
    const highFilter = ctx.createBiquadFilter();
  
    const pan = ctx.createStereoPanner();

    const chorusDelay = ctx.createDelay();
    const chorusSum = ctx.createGain();
    const chorusLFO = ctx.createOscillator();
    const chorusLFOGain = ctx.createGain();
    
    fxSend.connect(input);
    input.connect(delay)
    delay.connect(chorusDelay);
    chorusDelay.connect(chorusSum);
    chorusLFO.connect(chorusLFOGain);
    chorusLFOGain.connect(chorusDelay.delayTime);
    chorusSum.connect(lowFilter);
    lowFilter.connect(highFilter);
    highFilter.connect(feedback);
    highFilter.connect(delaySum);
    feedback.connect(input);
    delaySum.connect(pan);
    pan.connect(fxReturn);
    
    delay.delayTime.value = delayTime;

    chorusLFO.type = 'sine';
    chorusDelay.delayTime.value = 0.06;
    chorusLFOGain.gain.value = 0.0005;
    chorusLFO.frequency.setValueAtTime(0.5, ctx.currentTime);
    chorusLFO.start(0);

    lowFilter.frequency.value = 500;
    lowFilter.type = 'lowshelf';
    lowFilter.gain.value = defaults.lows;
    highFilter.frequency.value = 1500;
    highFilter.type = 'highshelf';
    highFilter.gain.value = defaults.highs;

    feedback.gain.value = feedbackValue;
    delaySum.gain.value = defaults.mix;
    pan.pan.value = panValue;
    input.gain.value = 1;

    const controls = pedal.querySelector('.pedal__controls');
    const delayHead = document.createElement('li');
    delayHead.classList.add('delay-head');
    controls.appendChild(delayHead);

    const subPedalDelay = createSubPedal(delayHead, 'Delay');
    const subPedalChorus = createSubPedal(delayHead, 'Chorus');
    const subPedalEQ = createSubPedal(delayHead, 'EQ');
    const subPedalMix = createSubPedal(delayHead, 'Mix');

    createRotaryKnob({
      pedal,
      name: 'speed',
      label: 'Speed',
      max: defaults.maxDelay,
      onInput: updatePot(delay.delayTime),
      value: delayTime,
      subPedal: subPedalDelay
    });

    createRotaryKnob({
      pedal,
      name: 'feedback',
      label: 'Feedback',
      max: 1,
      min: 0,
      onInput: updatePot(feedback.gain),
      value: feedbackValue,
      subPedal: subPedalDelay
    });

    createRotaryKnob({
      pedal,
      name: 'depth',
      label: 'Depth',
      min: 0.0000005,
      max: 0.005,
      step: 0.0001,
      onInput: updatePot(chorusLFOGain.gain),
      value: defaults.depth,
      subPedal: subPedalChorus
    });

    const $rate = createRotaryKnob({
      pedal,
      name: 'rate',
      label: 'Rate',
      min: 0,
      max: 4,
      step: 0.1,
      onInput: updatePot(chorusLFO.frequency),
      value: defaults.rate,
      subPedal: subPedalChorus
    });

    window.addEventListener('MIDIEXP', ({ detail }) => {
      const decimal = invlerp(0, 127, detail);
      const val = lerp(0, 4, decimal);
      chorusLFO.frequency.value = val;
      setKnob($rate, 0, 127, detail);
    });

    createRotaryKnob({
      pedal,
      name: 'bass',
      label: 'Bass',
      min: -4,
      max: 5,
      step: 0.25,
      onInput: updatePot(lowFilter.gain),
      value: defaults.lows,
      subPedal: subPedalEQ
    });

    createRotaryKnob({
      pedal,
      name: 'treble',
      label: 'Treble',
      min: -4,
      max: 5,
      step: 0.25,
      onInput: updatePot(highFilter.gain),
      value: defaults.highs,
      subPedal: subPedalEQ
    });

    createRotaryKnob({
      pedal,
      name: 'pan',
      label: 'Pan',
      min: -1,
      max: 1,
      step: 0.05,
      onInput: updatePot(pan.pan),
      value: panValue,
      subPedal: subPedalMix
    });

    createRotaryKnob({
      pedal,
      name: 'mix',
      label: 'Mix',
      min: 0,
      max: 1,
      step: 0.05,
      onInput: updatePot(delaySum.gain),
      value: defaults.mix,
      subPedal: subPedalMix
    });

    createToggle({
      pedal,
      name: 'active',
      label: 'On',
      active: true,
      subPedal: subPedalMix,
      onInput: (e) => {
        console.log(e.target.checked)
        input.gain.value = e.target.checked ? 1 : 0
      }
    })
  }

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'multihead-delay',
    label: 'setInterval',
    toggle,
    active: defaults.active,
    index
  });

  fxSend.connect(fxReturn);
  createDelayHead(fxSend, fxReturn, 1, 0.300, 0.5);
  createDelayHead(fxSend, fxReturn, -1, 0.463, 0.5);
  createDelayHead(fxSend, fxReturn, 0.5, 0.97561, 0.2);
  createDelayHead(fxSend, fxReturn, -0.5, 0.4878, 0.2);

  $pedalboard.appendChild(pedal);

  return output;
};
