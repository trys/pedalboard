import { lerp, invlerp } from './utils.js';

export const createToggle = ({
  pedal,
  name,
  label,
  active = true,
  onInput,
  subPedal
}) => {
  const type = pedal.dataset.type + subPedal ? Math.random().toString(36).substr(2, 9) : '';
  const wrapper = document.createElement('li');

  wrapper.innerHTML = `<input id="${type}_${name}" name="${name}" type="checkbox" ${active ? 'checked' : ''} />
  <label class="pedal-toggle-label" for="${type}_${name}">${label}</label>`;

  if (onInput) {
    wrapper.querySelector('input').addEventListener('change', onInput);
  }

  const $list = subPedal || pedal.querySelector('.pedal__controls');
  if ($list) {
    $list.appendChild(wrapper);
  }

  return wrapper;
};

export const createSwitch = ({
  pedal,
  name,
  label,
  value = 0,
  onInput,
  options = [],
  subPedal
}) => {
  const type = pedal.dataset.type + subPedal ? Math.random().toString(36).substr(2, 9) : '';
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

  const $list = subPedal || pedal.querySelector('.pedal__controls');
  if ($list) {
    $list.appendChild(wrapper);
  }

  return wrapper;
};

export const createPedal = ({ name, label, toggle, active, index = 0 }) => {
  const pedal = document.createElement('div');
  const id = name.replace(/\s/g, '-')
  pedal.innerHTML = `<ul class="pedal__controls"></ul>
  <div class="pedal__on-off">
    <input id="${id}_active" type="checkbox" ${active ? 'checked' : ''} />
    <output class="pedal__led"></output>
    <label for="${id}_active" class="pedal__button">Enable / Disable</label>
  </div>
  <h2>${label}</h2>
  <span class="pedal__jack"></span>
  <span class="pedal__jack"></span>`;

  const input = pedal.querySelector('[type="checkbox"]');
  input.addEventListener('change', () => toggle());

  window.addEventListener('MIDI', ({ detail }) => {
    if (detail === index) {
      input.checked = !input.checked;
      toggle();
    }
  });

  pedal.classList.add('pedal');
  pedal.classList.add(`pedal--${id}`);
  pedal.dataset.type = name;

  return pedal;
};

export const toggleOnOff = (dry, wet) => {
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

export const createInputSwitch = (input, output, active = false) => {
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

export const createInputSwitchWithTails = (input, active = false) => {
  const dry = ctx.createGain();
  const fxSend = ctx.createGain();
  const fxReturn = ctx.createGain();
  const sum = ctx.createGain();

  const toggle = toggleOnOff(dry, fxSend);
  toggle(active);

  input.connect(dry);
  input.connect(fxSend);

  dry.connect(sum);
  fxReturn.connect(sum);

  return [fxSend, fxReturn, sum, toggle];
};

export const setKnob = (knob, min, max, value) => {
  const decimal = invlerp(min, max, value);
  const squashed = lerp(0, 300, decimal);
  knob.style.setProperty('--percentage', squashed);
};

export const updatePot = (pot, key) => {
  return event => {
    if (key) {
      pot[key] = event.target.value;
    } else {
      pot.value = event.target.value;
    }
  };
};

export const createRotaryKnob = ({
  pedal,
  name,
  label,
  min = 0,
  max = 1,
  step = 0.01,
  value = 0,
  onInput,
  subPedal
}) => {
  const type = pedal.dataset.type + subPedal ? Math.random().toString(36).substr(2, 9) : '';
  const wrapper = document.createElement('li');

  wrapper.innerHTML = `<label for="${type}_${name}">${label}</label>
  <input type="range" id="${type}_${name}" name="${name}" min="${min}" max="${max}" value="${value}" step="${step}" />
  <button type="button" class="pedal__knob" style="--percentage: 10"></button>`;

  const knob = wrapper.querySelector('button');

  if (onInput) {
    const input = wrapper.querySelector('input');
    setKnob(knob, min, max, value);

    input.addEventListener('input', event => {
      onInput(event);
      setKnob(knob, min, max, event.target.value);
    });

    let engaged = false;
    let prevY = null;

    const engage = event => {
      engaged = true;
      let prevY = event.clientY;
      event.preventDefault();
    };

    const disengage = event => {
      engaged = false;
    };

    const rotaryMove = Y => {
      if (engaged) {
        if (prevY - Y === 0) {
          return;
        }

        const goingUp = prevY >= Y;
        prevY = Y;
        let diff = min < 0 ? min / -50 : max / 50;
        diff = diff < step ? step : diff;
        input.value = Number(input.value) + diff * (goingUp ? 1 : -1);

        input.dispatchEvent(
          new Event('input', {
            bubbles: true,
            cancelable: true
          })
        );
      }
    };

    knob.addEventListener('mousedown', engage);
    window.addEventListener('mouseup', disengage);
    knob.addEventListener('touchstart', engage);
    window.addEventListener('touchend', disengage);

    // Add touch support
    window.addEventListener('mousemove', event => {
      rotaryMove(event.clientY);
    });

    window.addEventListener('touchmove', event => {
      rotaryMove(event.touches[0].clientY);
    });
  }

  const $list = subPedal || pedal.querySelector('.pedal__controls');
  if ($list) {
    $list.appendChild(wrapper);
  }

  return knob;
};

