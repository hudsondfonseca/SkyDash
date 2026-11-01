// Fixed-step clock shared by the game loop and its Node unit tests.
(function (root, factory) {
    const FixedStepClock = factory();
    if (typeof module === 'object' && module.exports) module.exports = FixedStepClock;
    else root.FixedStepClock = FixedStepClock;
})(globalThis, function () {
    return class FixedStepClock {
        constructor(stepMs = 1000 / 60, maxSteps = 5) {
            this.stepMs = stepMs;
            this.maxFrameMs = stepMs * maxSteps;
            this.maxSteps = maxSteps;
            this.previousTime = null;
            this.accumulator = 0;
        }

        reset() {
            this.previousTime = null;
            this.accumulator = 0;
        }

        advance(timestamp) {
            const elapsed = this.previousTime === null
                ? this.stepMs
                : Math.max(0, Math.min(timestamp - this.previousTime, this.maxFrameMs));
            this.previousTime = timestamp;
            this.accumulator = Math.min(this.accumulator + elapsed, this.maxFrameMs);

            const steps = Math.min(Math.floor(this.accumulator / this.stepMs), this.maxSteps);
            this.accumulator -= steps * this.stepMs;
            return { steps, alpha: this.accumulator / this.stepMs };
        }
    };
});
