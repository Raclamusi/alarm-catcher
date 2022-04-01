"use strict";

const freqRange = document.getElementById("freq");
const volumeRange = document.getElementById("volume");
const freqInput = document.getElementById("freqOut");
const volumeInput = document.getElementById("volumeOut");
const messageInput = document.getElementById("message");
const startButton = document.getElementById("start");
const volumeBar = document.getElementById("volumeBar");
const volumeThreshold = document.getElementById("volumeThreshold");
const log = document.getElementById("log");

freqRange.addEventListener("input", () => {
    freqInput.value = freqRange.value;
});
volumeRange.addEventListener("input", () => {
    volumeInput.value = volumeRange.value;
    volumeThreshold.style.left = volumeRange.value + "px";
});
freqInput.addEventListener("input", () => {
    freqRange.value = freqInput.value;
});
volumeInput.addEventListener("input", () => {
    volumeRange.value = volumeInput.value;
    volumeThreshold.style.left = volumeRange.value + "px";
});

startButton.addEventListener("click", async () => {
    try {
        startButton.style.display = "none";
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.5;
        
        const distortion = audioContext.createWaveShaper();
        const gainNode = audioContext.createGain();
        const biquadFilter = audioContext.createBiquadFilter();
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(distortion);
        distortion.connect(biquadFilter);
        biquadFilter.connect(gainNode);
        gainNode.connect(analyser);

        analyser.fftSize = 32768;
        const freqStart = 220;
        const waveData = new Uint8Array(analyser.fftSize);
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        let speaking = false;
        const update = () => {
            analyser.getByteTimeDomainData(waveData);
            analyser.getByteFrequencyData(freqData);
            const [volume, f] = freqData.subarray(freqStart).reduce((acc, e, i) => acc[0] < e ? [e, i] : acc, [0, 0]);
            const freq = (f + freqStart) * 24000 / analyser.frequencyBinCount;
            console.log(`volume: ${volume}, freq: ${freq}`);
            log.textContent = `volume: ${volume}, freq: ${freq}`;
            volumeBar.style.width = Math.abs(freq - parseInt(freqRange.value)) <= 15 ? volume + "px" : "0";

            if (volume >= parseInt(volumeRange.value) && Math.abs(freq - parseInt(freqRange.value)) <= 15) {
                if (!speaking) {
                    speaking = true;
                    const uttr = new SpeechSynthesisUtterance();
                    uttr.text = messageInput.value;
                    speechSynthesis.speak(uttr);
                    document.body.style.backgroundColor = "red";
                }
            }
            else {
                if (speaking) {
                    speaking = false;
                    document.body.style.backgroundColor = "";
                }
            }
        };
        setInterval(update, 100);
    }
    catch (e) {
        console.error(e);
        log.textContent = e;
        log.style.color = "red";
    }
});
