import { updatePot, createRotaryKnob, createPedal, createInputSwitch } from '../dom.js';

export const overdrivePedal = function(input, index) {
  // Default settings
  const defaults = {
    active: false,
    drive: 15,
    volume: 1
  };

  // Create audio nodes
  const sum = ctx.createGain();
  const volume = ctx.createGain();
  const overdrive = ctx.createWaveShaper();

  const [output, toggle] = createInputSwitch(input, sum, defaults.active);

  // Set default values
  // @link https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
  function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for (; i < n_samples; ++i) {
      x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  overdrive.curve = makeDistortionCurve(defaults.drive);
  overdrive.oversample = '4x';
  volume.gain.value = 1;

  // Connect the nodes togther
  input.connect(overdrive);
  overdrive.connect(volume);
  volume.connect(sum);

  // Create the DOM nodes
  const pedal = createPedal({
    name: 'overdrive',
    label: 'Math.pow()',
    toggle,
    active: defaults.active,
    index
  });

  createRotaryKnob({
    pedal,
    name: 'drive',
    label: 'Drive',
    value: defaults.drive,
    min: 0,
    max: 100,
    onInput: event => {
      overdrive.curve = makeDistortionCurve(Number(event.target.value));
    }
  });

  createRotaryKnob({
    pedal,
    name: 'volume',
    label: 'Volume',
    value: defaults.volume,
    max: 3,
    onInput: updatePot(volume.gain)
  });

  $pedalboard.appendChild(pedal);

  return output;
};