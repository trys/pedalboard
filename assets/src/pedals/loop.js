import { updatePot, createRotaryKnob } from '../dom.js';

export const loopPedal = function(input, index) {
  // Default settings
  const defaults = {
    volume: 1
  };

  // Create audio nodes
  const output = ctx.createGain();
  const mixIn = ctx.createGain();
  const volume = ctx.createGain();

  const streamer = ctx.createMediaStreamDestination();
  const recorder = new MediaRecorder(streamer.stream);
  const audio = document.createElement('audio');
  const STATES = {
    empty: 'empty',
    recording: 'recording',
    prepared: 'prepared',
    idle: 'idle',
    cease: 'cease'
  };
  let recordHead = STATES.empty;

  recorder.addEventListener('dataavailable', e => {
    audio.src = URL.createObjectURL(e.data);

    if (recordHead === STATES.cease) {
      recordHead = STATES.idle;
      led.dataset.state = '';
      return;
    }

    audio.play();
    led.dataset.state = 'playing';
  });

  audio.addEventListener('ended', e => {
    if (recorder.state === 'recording') {
      recordHead = STATES.idle;
      recorder.stop();
    }

    if (recordHead === STATES.cease) {
      recordHead = STATES.idle;
      led.dataset.state = '';
      return;
    }

    if (recordHead === STATES.prepared) {
      recordHead = STATES.recording;
      recorder.start();
    }

    e.target.play();
    led.dataset.state =
      recordHead === STATES.recording ? 'overdubbing' : 'playing';
  });

  // Set default values
  volume.gain.value = defaults.volume;

  // Connect the nodes togther
  input.connect(output);
  input.connect(mixIn);
  mixIn.connect(streamer);
  const audioOut = ctx.createMediaElementSource(audio);
  audioOut.connect(volume);
  audioOut.connect(mixIn); // Loop back around for overdubbing
  volume.connect(output);

  const name = 'looper';
  const pedal = document.createElement('div');
  pedal.innerHTML = `<ul class="pedal__controls"></ul>
  <div class="pedal__on-off">
    <output class="pedal__led"></output>
    <div class="pedal__double-button">
      <button type="button" class="pedal__button" data-label aria-label="Loop"></button>
      <button type="button" class="pedal__button" data-label aria-label="Stop"></button>
    </div>
  </div>
  <h2>for(loop)</h2>
  <span class="pedal__jack"></span>
  <span class="pedal__jack"></span>`;

  pedal.classList.add('pedal');
  pedal.classList.add(`pedal--${name}`);
  pedal.dataset.type = name;

  const cassette = document.createElement('div');
  cassette.classList.add('cassette');
  cassette.innerHTML = `<span class="cassette__window"></span>
  <span class="cassette__head"></span>
  <span class="cassette__head"></span>`;
  pedal.appendChild(cassette);

  const led = pedal.querySelector('.pedal__led');
  const loopButton = pedal.querySelector('[aria-label="Loop"]');
  const stopButton = pedal.querySelector('[aria-label="Stop"]');
  led.dataset.state = '';

  loopButton.addEventListener('click', () => {
    if (recordHead === STATES.empty) {
      if (recorder.state === 'inactive') {
        led.dataset.state = 'recording';
        recorder.start();
      } else {
        recordHead = STATES.idle;
        recorder.stop();
      }
    } else {
      recordHead = STATES.prepared;
    }
  });

  stopButton.addEventListener('click', () => {
    if (recorder.state === 'recording') {
      recordHead = STATES.cease;
      recorder.stop();
      return;
    }

    recordHead = audio.paused ? STATES.idle : STATES.cease;
    led.dataset.state = audio.paused ? 'playing' : '';
    audio[audio.paused ? 'play' : 'pause']();
    audio.currentTime = 0;
  });

  window.addEventListener('MIDI', ({ detail }) => {
    if (detail === 121) {
      loopButton.dispatchEvent(
        new Event('click', {
          bubbles: true,
          cancelable: true
        })
      );
    } else if (detail === 122) {
      stopButton.dispatchEvent(
        new Event('click', {
          bubbles: true,
          cancelable: true
        })
      );
    } else if (detail === 123) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      recordHead = STATES.empty;
      led.dataset.state = '';
    }
  });

  createRotaryKnob({
    pedal,
    name: 'volume',
    label: 'Volume',
    max: 2,
    value: defaults.volume,
    onInput: updatePot(volume.gain)
  });

  $pedalboard.appendChild(pedal);

  return output;
};