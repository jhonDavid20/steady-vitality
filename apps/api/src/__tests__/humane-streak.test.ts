import { humaneStreak, shiftDate } from '../services/daily.service';

describe('humane streak', () => {
  it('preserves rest days and one isolated missed scheduled day', () => {
    expect(humaneStreak([
      { scheduled: 3, completed: 3 },
      { scheduled: 0, completed: 0 },
      { scheduled: 3, completed: 2 },
      { scheduled: 3, completed: 3 },
    ])).toBe(2);
  });

  it('stops after two consecutive missed scheduled days', () => {
    expect(humaneStreak([
      { scheduled: 2, completed: 2 },
      { scheduled: 2, completed: 1 },
      { scheduled: 2, completed: 0 },
    ])).toBe(0);
  });

  it('moves local calendar dates without server-timezone drift', () => {
    expect(shiftDate('2026-03-08', 1)).toBe('2026-03-09');
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31');
  });
});
