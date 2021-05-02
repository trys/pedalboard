const chorusPedal = function(input, index) {
  // Default settings
  const defaults = {
    speed: 1,
    mix: 0.3,
    active: false
  };

  // Create audio nodes
  const sum = ctx.createGain();
  const chorus = ctx.createDelay();
  const chorus2 = ctx.createDelay();
  const chorus3 = ctx.createDelay();
  const mixIn = ctx.createGain();
  const mixOut = ctx.createGain();

  const [output, toggle] = createInputSwitch(input, sum, defaults.active);

  // Set default values
  mixIn.gain.value = 1 - defaults.mix;
  mixOut.gain.value = defaults.mix;

  const step = 0.001;
  const min = 0.015;
  const max = 0.025;
  let timeModulation = min;
  let goingUp = true;
  chorus.delayTime.value = timeModulation;
  chorus2.delayTime.value = timeModulation + step;
  chorus3.delayTime.value = timeModulation + step + step;

  const modulate = () => {
    if (goingUp) {
      timeModulation += step;
      if (timeModulation >= max) {
        goingUp = false;
      }
    } else {
      timeModulation -= step;

      if (timeModulation <= min) {
        goingUp = true;
      }
    }

    chorus.delayTime.value = timeModulation;
    chorus2.delayTime.value = timeModulation + step;
    chorus3.delayTime.value = timeModulation + step + step;
    requestAnimationFrame(modulate);
  };

  requestAnimationFrame(modulate);

  // Connect the nodes togther
  input.connect(chorus);
  input.connect(chorus2);
  input.connect(chorus3);
  chorus.connect(mixOut);
  chorus2.connect(mixOut);
  chorus3.connect(mixOut);
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
