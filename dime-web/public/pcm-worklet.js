// Converts mic input to explicit little-endian mono PCM16, posting 50 ms chunks.
class PcmWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0;
    this.buf = new ArrayBuffer(1600);
    this.view = new DataView(this.buf);
    this.n = 0;
    this.acc = 0;
    this.accN = 0;
    this.port.onmessage = (event) => {
      if (event.data?.flush && this.n) this.emit();
    };
  }
  emit() {
    const chunk = this.buf.slice(0, this.n * 2);
    this.port.postMessage(chunk, [chunk]);
    this.buf = new ArrayBuffer(1600);
    this.view = new DataView(this.buf);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i];
      this.accN++;
      this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.acc / this.accN));
        this.acc = 0;
        this.accN = 0;
        this.view.setInt16(this.n++ * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
        if (this.n === 800) this.emit();
      }
    }
    return true;
  }
}
registerProcessor("pcm-worklet", PcmWorklet);
