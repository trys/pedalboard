const load = () => {
  // @ts-ignore
  const ctx = new window.AudioContext();
  const audio = document.querySelector('audio');
  const controls = {
    mix: (document.querySelector('[name="mix"]') as HTMLInputElement) || null,
    feedback:
      (document.querySelector('[name="feedback"]') as HTMLInputElement) || null,
    speed:
      (document.querySelector('[name="speed"]') as HTMLInputElement) || null,
    tone: (document.querySelector('[name="tone"]') as HTMLInputElement) || null
  };

  if (!audio) {
    return;
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(stream => {
      // const source = ctx.createMediaStreamSource(stream);

      audio.currentTime = 41;
      audio.play();
      const source = ctx.createMediaElementSource(audio);

      const pitchReturn = ctx.createGain();
      const delayGain = ctx.createGain();
      const feedback = ctx.createGain();
      const delay = ctx.createDelay();
      const filter = ctx.createBiquadFilter();
      const feedbackFilter = ctx.createBiquadFilter();

      const defaults = {
        tone: 1200,
        speed: 0.4,
        mix: 0.6,
        feedback: 0.35
      };

      delay.delayTime.value = defaults.speed;
      feedback.gain.value = defaults.feedback;
      delayGain.gain.value = defaults.mix;
      feedbackFilter.frequency.value = defaults.tone;
      filter.frequency.value = defaults.tone;

      source.connect(delay);
      source.connect(ctx.destination);
      delay.connect(feedback);
      feedback.connect(feedbackFilter);
      feedbackFilter.connect(delay);
      delay.connect(filter);
      filter.connect(delayGain);
      delayGain.connect(ctx.destination);

      const update = pot => {
        return event => {
          pot.value = event.target.value;
        };
      };

      controls.mix.value = String(defaults.mix);
      controls.mix.addEventListener('input', update(delayGain.gain));

      controls.feedback.value = String(defaults.feedback);
      controls.feedback.addEventListener('input', update(feedback.gain));

      controls.speed.value = String(defaults.speed);
      controls.speed.addEventListener('input', update(delay.delayTime));

      controls.tone.value = String(defaults.tone);
      controls.tone.addEventListener('input', event => {
        update(feedbackFilter.frequency)(event);
        update(filter.frequency)(event);
      });
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
