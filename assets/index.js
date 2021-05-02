import { multiHeadDelay } from './src/pedals/multihead-delay.js';
import { reverbPedal } from './src/pedals/reverb.js';
import { loopPedal } from './src/pedals/loop.js';
import { delayPedal } from './src/pedals/delay.js';
import { wahPedal } from './src/pedals/wah.js';
import { tremoloPedal } from './src/pedals/tremolo.js';
import { harmonicTremoloPedal } from './src/pedals/harmonic-tremolo.js';
import { boostPedal } from './src/pedals/boost.js';
import { compressorPedal } from './src/pedals/compressor.js';
import { overdrivePedal } from './src/pedals/overdrive.js';


const load = async LIVE => {
  const DEV = false;
  window.ctx = new window.AudioContext();
  window.$pedalboard = document.querySelector('.pedalboard');
  const audio = document.querySelector('audio');
  window.buffer = null;

  if (!audio) {
    return;
  } 

  const onError = (message = '') => {
    const error = document.createElement('div');
    error.innerHTML = message;
    error.classList.add('error');
    document.body.appendChild(error);
  };

  const onMidiMessage = ({ data }) => {
    if (data[0] === 144) {
      window.dispatchEvent(new CustomEvent('MIDI', { detail: data[1] }));
    }

    if (data[0] === 176) {
      window.dispatchEvent(new CustomEvent('MIDIEXP', { detail: data[2] }));
    }
  };

  await fetch('/assets/Conic Long Echo Hall.wav')
    .then(response => response.arrayBuffer())
    .then(data => {
      return ctx.decodeAudioData(data, b => {
        buffer = b;
      });
    })
    .catch(e => onError('Failed to load reverb impulse'));

  try {
    const midiCtx = await navigator.requestMIDIAccess();

    midiCtx.inputs.forEach(entry => {
      entry.onmidimessage = onMidiMessage;
    });
  } catch (e) {
    console.log('No midi connectivity');
  }

  let stream;
  if (LIVE) {
    stream = await navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false
      })
      .catch(e => onError("Couldn't connect to your microphone 😔"));
  }

  let source;

  if (LIVE) {
    source = ctx.createMediaStreamSource(stream);
  } else {
    source = ctx.createMediaElementSource(audio);
    audio.muted = false;
    audio.volume = DEV ? 0 : 1;
    audio.currentTime = 2;
    audio.play();
  }

  const pedals = [
    wahPedal,
    compressorPedal,
    overdrivePedal,
    boostPedal,
    harmonicTremoloPedal,
    delayPedal,
    multiHeadDelay,
    tremoloPedal,
    reverbPedal
  ];

  if (window.MediaRecorder !== undefined) {
    pedals.push(loopPedal)
  }

  const output = pedals.reduce((input, pedal, index) => {
    return pedal(input, index + 1);
  }, source);

  output.connect(ctx.destination);
};

(() => {
  const getStarted = ({ target }) => {
    document.body.classList.remove('loading');
    setTimeout(() => {
      target.parentNode.remove();
      load(target.classList.contains('start--live'));
    }, 1000);
  };

  [].forEach.call(document.querySelectorAll('.start'), el => {
    el.addEventListener('click', getStarted);
  });
})();
