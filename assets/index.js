const load = () => {
  // @ts-ignore
  const ctx = new window.AudioContext();
  const audio = document.querySelector('audio');

  if (!audio) {
    return;
  }

  const updatePot = pot => {
    return event => {
      pot.value = event.target.value;
    };
  };

  const delayPedal = function(input, selector) {
    const $pedal = document.querySelector(selector);
    if (!$pedal) {
      return input;
    }

    const delayGain = ctx.createGain();
    const feedback = ctx.createGain();
    const delay = ctx.createDelay();
    const filter = ctx.createBiquadFilter();
    const feedbackFilter = ctx.createBiquadFilter();
    const output = ctx.createGain();

    const defaults = {
      tone: 1200,
      speed: 0.8,
      mix: 0.6,
      feedback: 0.35
    };

    delay.delayTime.value = defaults.speed;
    feedback.gain.value = defaults.feedback;
    delayGain.gain.value = defaults.mix;
    feedbackFilter.frequency.value = defaults.tone;
    filter.frequency.value = defaults.tone;

    input.connect(output);
    input.connect(delay);

    delay.connect(feedback);
    feedback.connect(feedbackFilter);
    feedbackFilter.connect(delay);
    delay.connect(filter);
    filter.connect(delayGain);

    delayGain.connect(output);

    const controls = {
      mix: $pedal.querySelector('[name="mix"]'),
      feedback: $pedal.querySelector('[name="feedback"]'),
      speed: $pedal.querySelector('[name="speed"]'),
      tone: $pedal.querySelector('[name="tone"]')
    };

    controls.mix.value = String(defaults.mix);
    controls.mix.addEventListener('input', updatePot(delayGain.gain));

    controls.feedback.value = String(defaults.feedback);
    controls.feedback.addEventListener('input', updatePot(feedback.gain));

    controls.speed.value = String(defaults.speed);
    controls.speed.addEventListener('input', updatePot(delay.delayTime));

    controls.tone.value = String(defaults.tone);
    controls.tone.addEventListener('input', event => {
      updatePot(feedbackFilter.frequency)(event);
      updatePot(filter.frequency)(event);
    });

    return output;
  };

  const tremoloPedal = function(input, selector) {
    const $pedal = document.querySelector(selector);
    if (!$pedal) {
      return input;
    }

    const delayGain = ctx.createGain();
    const output = ctx.createGain();
    const lfo = ctx.createOscillator();
    const tremolo = ctx.createGain();
    const depthIn = ctx.createGain();
    const depthOut = ctx.createGain();

    const defaults = {
      speed: 1,
      depth: 1,
      wave: 'sine'
    };

    lfo.frequency.value = defaults.speed;
    depthIn.gain.value = 1 - defaults.depth;
    depthOut.gain.value = defaults.depth;

    lfo.connect(tremolo);
    input.connect(tremolo.gain);
    tremolo.connect(depthOut);
    depthOut.connect(output);
    input.connect(depthIn);
    depthIn.connect(output);
    lfo.start();

    const controls = {
      speed: $pedal.querySelector('[name="speed"]'),
      depth: $pedal.querySelector('[name="depth"]'),
      wave: $pedal.querySelector('[name="wave"]')
    };

    controls.speed.value = String(defaults.speed);
    controls.speed.addEventListener('input', updatePot(lfo.frequency));

    controls.depth.value = String(defaults.depth);
    controls.depth.addEventListener('input', event => {
      depthIn.gain.value = 1 - Number(event.target.value);
      depthOut.gain.value = Number(event.target.value);
      // set value at time?
    });

    controls.wave.value = String(defaults.wave);
    controls.wave.addEventListener('input', updatePot(lfo.type));

    return output;
  };

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(stream => {
      // const source = ctx.createMediaStreamSource(stream);

      audio.currentTime = 41;
      audio.play();
      const source = ctx.createMediaElementSource(audio);

      // const pedal1 = delayPedal(source, '.delay-pedal');
      const pedal2 = tremoloPedal(source, '.tremolo-pedal');

      pedal2.connect(ctx.destination);
    });
};

(() => {
  const starter = document.querySelector('.start');
  if (starter) {
    const getStarted = () => {
      load();
      starter.removeEventListener('click', getStarted);
      starter.remove();
    };
    starter.addEventListener('click', getStarted);
  }
})();
