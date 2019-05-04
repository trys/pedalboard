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

  const createRotaryKnob = ({
    pedal,
    name,
    label,
    min = 0,
    max = 1,
    step = 0.01,
    value = 0,
    onInput
  }) => {
    const type = pedal.dataset.type;
    const wrapper = document.createElement('li');

    wrapper.innerHTML = `<label for="${type}_${name}">${label}</label>
    <input type="range" id="${type}_${name}" name="${name}" min="${min}" max="${max}" value="${value}" step="${step}" />
    <button type="button" class="pedal__knob"></button>`;

    if (onInput) {
      wrapper.querySelector('input').addEventListener('input', onInput);
    }

    const $list = pedal.querySelector('ul');
    if ($list) {
      $list.appendChild(wrapper);
    }

    return wrapper;
  };

  const createSwitch = ({
    pedal,
    name,
    label,
    value = 0,
    onInput,
    options = []
  }) => {
    const type = pedal.dataset.type;
    const wrapper = document.createElement('li');

    wrapper.innerHTML = `<label for="${type}_${name}">${label}</label>
    <select id="${type}_${name}" name="${name}"/>
      ${options
        .map(({ label, value: val }) => {
          return `<option value="${val}"${
            value === val ? ' selected' : ''
          }>${label}</option>`;
        })
        .join('')}
    </select>`;

    if (onInput) {
      wrapper.querySelector('select').addEventListener('change', onInput);
    }

    const $list = pedal.querySelector('ul');
    if ($list) {
      $list.appendChild(wrapper);
    }

    return wrapper;
  };

  const createPedal = ({ name, label, toggle, active }) => {
    const pedal = document.createElement('div');
    const list = document.createElement('ul');
    const title = document.createElement('h2');
    const onOff = document.createElement('button');

    pedal.innerHTML = `<ul class="pedal__controls"></ul>
    <div class="pedal__on-off">
      <input id="${name}_active" type="checkbox" ${active ? 'checked' : ''} />
      <output class="pedal__led"></output>
      <label for="${name}_active">Enable / Disable</label>
    </div>
    <h2>${label}</h2>
    <span class="pedal__jack"></span>
    <span class="pedal__jack"></span>`;

    title.innerText = label;

    pedal.classList.add('pedal');
    pedal.classList.add(`pedal--${name}`);
    pedal.dataset.type = name;

    pedal
      .querySelector('[type="checkbox"]')
      .addEventListener('change', () => toggle());

    return pedal;
  };

  const toggleOnOff = (dry, wet) => {
    return on => {
      const active = on === undefined ? !!dry.gain.value : on;

      if (active) {
        wet.gain.value = 1;
        dry.gain.value = 0;
      } else {
        wet.gain.value = 0;
        dry.gain.value = 1;
      }
    };
  };

  const createInputSwitch = (input, output, active = false) => {
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const out = ctx.createGain();

    const toggle = toggleOnOff(dry, wet);
    toggle(active);

    input.connect(dry);
    output.connect(wet);

    dry.connect(out);
    wet.connect(out);

    return [out, toggle];
  };

  const delayPedal = function(input) {
    // Default settings
    const defaults = {
      tone: 1200,
      speed: 0.8,
      mix: 0.6,
      feedback: 0.35,
      active: false
    };

    // Create audio nodes
    const sum = ctx.createGain();
    const delayGain = ctx.createGain();
    const feedback = ctx.createGain();
    const delay = ctx.createDelay();
    const filter = ctx.createBiquadFilter();

    // Set default values
    delay.delayTime.value = defaults.speed;
    feedback.gain.value = defaults.feedback;
    delayGain.gain.value = defaults.mix;
    filter.frequency.value = defaults.tone;

    // Connect the nodes togther
    input.connect(sum);
    input.connect(filter);
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delayGain);
    delayGain.connect(delay);
    delayGain.connect(sum);

    const [output, toggle] = createInputSwitch(input, sum, defaults.active);

    // Create the DOM nodes
    const pedal = createPedal({
      name: 'delay',
      label: 'setTimeout',
      toggle,
      active: defaults.active
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
      max: 1.5,
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

  const tremoloPedal = function(input) {
    // Default settings
    const defaults = {
      speed: 3,
      depth: 0.4,
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
    input.connect(tremolo);
    tremolo.connect(depthOut);
    depthOut.connect(sum);
    input.connect(depthIn);
    depthIn.connect(sum);
    lfo.start();

    // Create the DOM nodes
    const pedal = createPedal({
      name: 'tremolo',
      label: '&lt;blink /&gt;',
      toggle,
      active: defaults.active
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
        // set value at time?
        // Check stereo issues
        // Look at custom lfo curve
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

  const chorusPedal = function(input) {
    // Default settings
    const defaults = {
      speed: 1,
      mix: 1,
      active: false
    };

    // Create audio nodes
    const sum = ctx.createGain();
    const lfo = ctx.createOscillator();
    const chorus = ctx.createDelay();

    const [output, toggle] = createInputSwitch(input, sum, defaults.active);

    // Set default values
    lfo.frequency.value = defaults.speed;

    let timeModulation = 0.011;
    const offset = 0.002;
    const max = 0.05;
    const min = 0;
    let goingUp = true;
    chorus.delayTime.value = timeModulation;

    setInterval(() => {
      if (goingUp) {
        timeModulation += offset;
        if (timeModulation >= max) {
          goingUp = false;
        }
      } else {
        timeModulation -= offset;

        if (timeModulation <= min) {
          goingUp = true;
        }
      }

      // chorus.delayTime.setValueAtTime(timeModulation, ctx.currentTime);
      chorus.delayTime = timeModulation;
    }, 10);

    // Connect the nodes togther
    input.connect(sum);
    input.connect(chorus);
    chorus.connect(sum);
    // lfo.connect(chorus.delayTime);
    lfo.start();

    // Create the DOM nodes
    const pedal = createPedal({
      name: 'chorus',
      label: 'float',
      toggle,
      active: defaults.active
    });

    createRotaryKnob({
      pedal,
      name: 'mix',
      label: 'Mix',
      max: 4,
      onInput: updatePot(lfo.frequency),
      value: defaults.speed
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
      max: 4,
      onInput: updatePot(lfo.frequency),
      value: defaults.speed
    });

    $pedalboard.appendChild(pedal);

    return output;
  };

  const boostPedal = function(input) {
    // Default settings
    const defaults = {
      gain: 1.25,
      active: false
    };

    // Create audio nodes
    const sum = ctx.createGain();

    const [output, toggle] = createInputSwitch(input, sum, defaults.active);

    // Set default values
    sum.gain.value = defaults.gain;

    // Connect the nodes togther
    input.connect(sum);

    // Create the DOM nodes
    const pedal = createPedal({
      name: 'boost',
      label: '!important',
      toggle,
      active: defaults.active
    });

    createRotaryKnob({
      pedal,
      name: 'boost',
      label: 'Boost',
      max: 3,
      onInput: updatePot(output.gain),
      value: defaults.gain
    });

    $pedalboard.appendChild(pedal);

    return output;
  };

  const reverbPedal = function(input) {
    // Default settings
    const defaults = {
      gain: 1.25,
      active: false
    };

    // Create audio nodes
    const sum = ctx.createGain();

    const [output, toggle] = createInputSwitch(input, sum, defaults.active);

    // Set default values
    sum.gain.value = defaults.gain;

    // Connect the nodes togther
    input.connect(sum);

    // Create the DOM nodes
    const pedal = createPedal({
      name: 'reverb',
      label: 'spacer.gif',
      toggle,
      active: defaults.active
    });

    createRotaryKnob({
      pedal,
      name: 'mix',
      label: 'Mix',
      max: 3,
      onInput: updatePot(output.gain),
      value: defaults.gain
    });

    $pedalboard.appendChild(pedal);

    return output;
  };

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(stream => {
      // const source = ctx.createMediaStreamSource(stream);
      const source = ctx.createMediaElementSource(audio);

      audio.currentTime = 41;
      audio.play();

      const pedals = [
        boostPedal,
        chorusPedal,
        delayPedal,
        reverbPedal,
        tremoloPedal
      ];

      const output = pedals.reduce((input, pedal) => {
        return pedal(input);
      }, source);

      output.connect(ctx.destination);
    });
};

(() => {
  // load();

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
