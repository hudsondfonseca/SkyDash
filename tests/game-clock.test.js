const test = require('node:test');
const assert = require('node:assert/strict');
const FixedStepClock = require('../game-clock.js');

test('starts with one simulation step', () => {
    const clock = new FixedStepClock(10, 5);
    assert.deepEqual(clock.advance(0), { steps: 1, alpha: 0 });
});

test('produces two simulation steps for a 30 Hz frame', () => {
    const clock = new FixedStepClock(10, 5);
    clock.advance(0);
    assert.deepEqual(clock.advance(20), { steps: 2, alpha: 0 });
});

test('accumulates 120 Hz frames without speeding up simulation', () => {
    const clock = new FixedStepClock(10, 5);
    clock.advance(0);
    assert.deepEqual(clock.advance(5), { steps: 0, alpha: 0.5 });
    assert.deepEqual(clock.advance(10), { steps: 1, alpha: 0 });
});

test('caps long pauses to avoid a catch-up spiral', () => {
    const clock = new FixedStepClock(10, 5);
    clock.advance(0);
    assert.deepEqual(clock.advance(10_000), { steps: 5, alpha: 0 });
});

test('reset discards accumulated time', () => {
    const clock = new FixedStepClock(10, 5);
    clock.advance(0);
    clock.advance(5);
    clock.reset();
    assert.deepEqual(clock.advance(100), { steps: 1, alpha: 0 });
});
