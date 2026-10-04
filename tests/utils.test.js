import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  calculateProgress,
  getGreeting,
  isNightShift,
  hapticFeedback,
} from '../src/utils/index.js';

describe('Frontend Apple HIG Utilities & Math Engine Tests', () => {
  describe('formatTime', () => {
    it('formats zero seconds as MM:SS', () => {
      assert.equal(formatTime(0), '00:00');
    });

    it('formats standard seconds as MM:SS', () => {
      assert.equal(formatTime(59), '00:59');
      assert.equal(formatTime(65), '01:05');
      assert.equal(formatTime(720), '12:00');
    });

    it('formats hour-level durations as HH:MM:SS', () => {
      assert.equal(formatTime(3600), '01:00:00');
      assert.equal(formatTime(3665), '01:01:05');
      assert.equal(formatTime(7325), '02:02:05');
    });

    it('safely handles null, undefined, negative numbers, and strings', () => {
      assert.equal(formatTime(null), '00:00');
      assert.equal(formatTime(undefined), '00:00');
      assert.equal(formatTime(-45), '00:00');
      assert.equal(formatTime('120'), '02:00');
      assert.equal(formatTime('not-a-number'), '00:00');
    });
  });

  describe('calculateProgress', () => {
    it('calculates standard percentages accurately', () => {
      assert.equal(calculateProgress(0, 100), 0);
      assert.equal(calculateProgress(50, 100), 50);
      assert.equal(calculateProgress(1, 3), 33);
      assert.equal(calculateProgress(2, 3), 67);
      assert.equal(calculateProgress(10, 10), 100);
    });

    it('caps progress between 0 and 100', () => {
      assert.equal(calculateProgress(15, 10), 100);
      assert.equal(calculateProgress(-5, 10), 0);
    });

    it('safely handles divide-by-zero protection', () => {
      assert.equal(calculateProgress(0, 0), 0);
      assert.equal(calculateProgress(5, 0), 100);
      assert.equal(calculateProgress(0, -10), 0);
    });

    it('safely handles non-numeric and null inputs', () => {
      assert.equal(calculateProgress(null, null), 0);
      assert.equal(calculateProgress('5', '20'), 25);
      assert.equal(calculateProgress('abc', 'def'), 0);
    });
  });

  describe('getGreeting (Apple HIG Contextual Time of Day)', () => {
    it('returns morning greeting from 5:00 to 11:59', () => {
      const morning = new Date('2026-10-01T08:30:00');
      assert.equal(getGreeting(morning), 'Good morning,');
    });

    it('returns afternoon greeting from 12:00 to 16:59', () => {
      const afternoon = new Date('2026-10-01T14:15:00');
      assert.equal(getGreeting(afternoon), 'Good afternoon,');
    });

    it('returns evening greeting from 17:00 to 21:59', () => {
      const evening = new Date('2026-10-01T19:45:00');
      assert.equal(getGreeting(evening), 'Good evening,');
    });

    it('returns late night focus greeting from 22:00 to 4:59', () => {
      const lateNight = new Date('2026-10-01T23:30:00');
      const earlyHours = new Date('2026-10-01T03:00:00');
      assert.equal(getGreeting(lateNight), 'Late night focus,');
      assert.equal(getGreeting(earlyHours), 'Late night focus,');
    });
  });

  describe('isNightShift (Comfort Lighting Indicator)', () => {
    it('returns true during night hours (22:00 to 4:59)', () => {
      assert.equal(isNightShift(new Date('2026-10-01T22:00:00')), true);
      assert.equal(isNightShift(new Date('2026-10-01T02:00:00')), true);
      assert.equal(isNightShift(new Date('2026-10-01T04:59:00')), true);
    });

    it('returns false during daytime hours (5:00 to 21:59)', () => {
      assert.equal(isNightShift(new Date('2026-10-01T05:00:00')), false);
      assert.equal(isNightShift(new Date('2026-10-01T12:00:00')), false);
      assert.equal(isNightShift(new Date('2026-10-01T21:59:00')), false);
    });
  });

  describe('hapticFeedback', () => {
    it('provides all expected haptic feedback patterns without throwing errors in Node environment', () => {
      assert.doesNotThrow(() => hapticFeedback.tap());
      assert.doesNotThrow(() => hapticFeedback.light());
      assert.doesNotThrow(() => hapticFeedback.checkbox());
      assert.doesNotThrow(() => hapticFeedback.swipe());
      assert.doesNotThrow(() => hapticFeedback.medium());
      assert.doesNotThrow(() => hapticFeedback.heavy());
      assert.doesNotThrow(() => hapticFeedback.success());
      assert.doesNotThrow(() => hapticFeedback.bulkComplete());
      assert.doesNotThrow(() => hapticFeedback.timerSuccess());
      assert.doesNotThrow(() => hapticFeedback.warning());
      assert.doesNotThrow(() => hapticFeedback.error());
    });
  });
});
