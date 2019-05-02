const load = () => {
  const ctx = new window.AudioContext();
  const audio = document.querySelector('audio');
  const $pedalboard = document.querySelector('.pedalboard');

  if (!audio) {
    return;
  }

  const updatePot = pot => {
    return event => {
      pot.value = event.target.value;
    };
  };

  const createRotaryKnob = ({ type, name, label, min = 0, max = 1, step = 0.01, value = 0, onInput }) => {
    const wrapper = document.createElement('li');
    wrapper.innerHTML = `<label for="${type}_${name}">${label}</label>
    <input type="range" id="${type}_${name}" name="${name}" min="${min}" max="${max}" value="${value}" step="${step}" />`

    if (onInput) {
      wrapper.querySelector('input').addEventListener('input', onInput);
    }

    return wrapper;
  }

  const createPedal = ({ name }) => {
    const pedal = document.createElement('div');
    const list  = document.createElement('ul');
    pedal.classList.add('pedal');
    pedal.classList.add(`pedal--${name}`)
    pedal.appendChild(list)
    return [pedal, list];
  }

  const delayPedal = function(input) {
    const defaults = {
      tone: 1200,
      speed: 0.8,
      mix: 0.6,
      feedback: 0.35
    };

    const delayGain = ctx.createGain();
    const feedback = ctx.createGain();
    const delay = ctx.createDelay();
    const filter = ctx.createBiquadFilter();
    const output = ctx.createGain();

    delay.delayTime.value = defaults.speed;
    feedback.gain.value = defaults.feedback;
    delayGain.gain.value = defaults.mix;
    filter.frequency.value = defaults.tone;

    input.connect(output);
    input.connect(filter);
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delayGain);
    delayGain.connect(delay);
    delayGain.connect(output);


    const [$el, $list] = createPedal({ name: 'delay' });    
    
    const $mix = createRotaryKnob({
      name: 'mix',
      label: 'Mix',
      type: 'delay',
      onInput: updatePot(delayGain.gain),
      value: defaults.mix
    });
    
    const $feedback = createRotaryKnob({
      name: 'feedback',
      label: 'Feedback',
      type: 'delay',
      max: 0.7,
      onInput: updatePot(feedback.gain),
      value: defaults.feedback
    });
    
    const $speed = createRotaryKnob({
      name: 'speed',
      label: 'Speed',
      type: 'delay',
      max: 1.5,
      onInput: updatePot(delay.delayTime),
      value: defaults.speed
    });
    
    const $tone = createRotaryKnob({
      name: 'tone',
      label: 'Tone',
      type: 'delay',
      min: 200,
      max: 6000,
      step: 200,
      onInput: updatePot(filter.frequency),
      value: defaults.tone
    });

    $list.appendChild($mix);
    $list.appendChild($feedback);
    $list.appendChild($speed);
    $list.appendChild($tone);

    $pedalboard.appendChild($el);

    return output;
  };

  const tremoloPedal = function(input, selector) {
    const defaults = {
      speed: 1,
      depth: 1,
      wave: 'sine'
    };

    const output = ctx.createGain();
    const lfo = ctx.createOscillator();
    const tremolo = ctx.createGain();
    const depthIn = ctx.createGain();
    const depthOut = ctx.createGain();

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

    const [$el, $list] = createPedal({ name: 'tremolo' });    
    
    const $speed = createRotaryKnob({
      name: 'speed',
      label: 'Speed',
      type: 'tremolo',
      max: 4,
      onInput: updatePot(lfo.frequency),
      value: defaults.speed
    });

    const $depth = createRotaryKnob({
      name: 'depth',
      label: 'Depth',
      type: 'tremolo',
      value: defaults.depth
    });
    $depth.querySelector('input').addEventListener('input', (event) => {
      depthIn.gain.value = 1 - Number(event.target.value);
      depthOut.gain.value = Number(event.target.value);
      // set value at time?
    });

    $list.appendChild($speed);
    $list.appendChild($depth);
    $pedalboard.appendChild($el);

    // controls.wave.value = String(defaults.wave);
    // controls.wave.addEventListener('input', updatePot(lfo.type));

    return output;
  };

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(stream => {
      // const source = ctx.createMediaStreamSource(stream);

      // audio.currentTime = 41;
      // audio.play();
      const source = ctx.createMediaElementSource(stream);

      const pedal1 = delayPedal(source);
      const pedal2 = tremoloPedal(pedal1);
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
