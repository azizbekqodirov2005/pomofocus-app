/* Integration smoke test: real DOM (jsdom), real providers, controlled clock. */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html data-theme="light"><body><div id="root"></div></body></html>', {
  url: 'https://fokus.test/',
  pretendToBeVisual: true,
});

const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.MediaQueryListEvent = dom.window.MediaQueryListEvent ?? class {};
g.requestAnimationFrame = (cb: FrameRequestCallback) => dom.window.setTimeout(() => cb(0), 0) as unknown as number;
g.cancelAnimationFrame = (id: number) => dom.window.clearTimeout(id);

dom.window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

class FakeNotification {
  static permission = 'granted';
  static requestPermission = async () => 'granted';
  onclick: (() => void) | null = null;
  close() {}
  constructor(public title: string, public options?: unknown) {
    FakeNotification.sent.push(title);
  }
  static sent: string[] = [];
}
(dom.window as unknown as Record<string, unknown>).Notification = FakeNotification;
g.Notification = FakeNotification;

// Minimal Web Audio stub: the chime must be attempted but produce no sound here.
let chimes = 0;
class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  async resume() {}
  createOscillator() {
    chimes += 1;
    return {
      type: '',
      frequency: { setValueAtTime: () => undefined },
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => undefined,
        linearRampToValueAtTime: () => undefined,
        exponentialRampToValueAtTime: () => undefined,
      },
      connect: () => undefined,
    };
  }
}
(dom.window as unknown as Record<string, unknown>).AudioContext = FakeAudioContext;
g.AudioContext = FakeAudioContext;

// Controlled clock: real timers still fire, but "now" is ours to move.
const RealDate = Date;
const realNow = RealDate.now();
let offset = 0;

class FakeDate extends RealDate {
  constructor(...args: ConstructorParameters<typeof Date> | []) {
    if (args.length === 0) {
      super(RealDate.now() + offset);
    } else {
      // @ts-expect-error — forwarding the original overloads verbatim.
      super(...args);
    }
  }
  static override now(): number {
    return RealDate.now() + offset;
  }
}

globalThis.Date = FakeDate as unknown as DateConstructor;
(dom.window as unknown as Record<string, unknown>).Date = FakeDate;

const advance = (ms: number) => {
  offset += ms;
};

g.IS_REACT_ACT_ENVIRONMENT = true;

// Notifications are opt-in; enable them up front so the alert path is covered.
dom.window.localStorage.setItem(
  'fokus.settings',
  JSON.stringify({
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    dailyGoal: 8,
    soundEnabled: true,
    notificationsEnabled: true,
    autoStartBreaks: false,
    autoStartFocus: false,
  }),
);

const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const App = (await import('../src/App')).default;

const root = createRoot(document.getElementById('root')!);
const wait = (ms = 60) => new Promise((resolve) => dom.window.setTimeout(resolve, ms));

let failures = 0;
function check(name: string, condition: boolean, extra = '') {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}
const text = () => document.body.textContent ?? '';
/** React tracks input values via its own descriptor; use the native setter. */
const setInputValue = (element: HTMLInputElement, value: string) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    dom.window.HTMLInputElement.prototype,
    'value',
  );
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
};
const byLabel = (label: string) =>
  document.querySelector<HTMLElement>(`[aria-label="${label}"]`);
const clockText = () => document.querySelector('.clock-digits')?.textContent?.trim() ?? '';

await act(async () => {
  root.render(<App />);
});
await act(async () => {
  await wait();
});

console.log('\n1. Initial render (default settings, Uzbek)');
check('clock shows 25:00', clockText() === '25:00', clockText());
check('Uzbek interface', text().includes('Vazifalar') && text().includes('Boshlash'));
check('phase attribute set', document.documentElement.dataset.phase === 'focus');
check('empty task state shown', text().includes('Hali vazifa yo‘q'));

console.log('\n2. Task creation and activation');
const taskInput = document.querySelector<HTMLInputElement>('input[type="text"], input:not([type])');
await act(async () => {
  setInputValue(taskInput!, 'Hisobot yozish');
  await wait();
});
const addForm = document.querySelector('form');
await act(async () => {
  addForm!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await wait();
});
check('task appears in list', text().includes('Hisobot yozish'));
check('task becomes active', text().includes('Faol'));
check('tasks persisted', (JSON.parse(dom.window.localStorage.getItem('fokus.tasks') ?? '[]') as unknown[]).length === 1);

console.log('\n3. Start, then jump the wall clock forward 60s');
const startBtn = Array.from(document.querySelectorAll('button')).find((b) =>
  b.textContent?.includes('Boshlash'),
);
await act(async () => {
  startBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait();
});
check('status is running', text().includes('Davom etmoqda'));
advance(60_000);
await act(async () => {
  await wait(320);
});
check('clock is 24:00 after 60s of wall time (no drift)', clockText() === '24:00', clockText());

console.log('\n4. Pause keeps the remaining time, and time does not leak while paused');
const pauseBtn = Array.from(document.querySelectorAll('button')).find((b) =>
  b.textContent?.includes('To‘xtatish'),
);
await act(async () => {
  pauseBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait();
});
check('status is paused', text().includes('To‘xtatilgan'));
advance(120_000);
await act(async () => {
  await wait(320);
});
check('clock still 24:00 while paused', clockText() === '24:00', clockText());

console.log('\n5. Resume and run the session out');
const resumeBtn = Array.from(document.querySelectorAll('button')).find((b) =>
  b.textContent?.includes('Davom etish'),
);
await act(async () => {
  resumeBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait();
});
advance(24 * 60_000 + 500);
await act(async () => {
  await wait(400);
});
check('switched to short break', text().includes('Qisqa tanaffus'));
check('break duration loaded', clockText() === '05:00', clockText());
check('phase attribute switched', document.documentElement.dataset.phase === 'short');
check('focus session counted', text().includes('Fokus seanslari'));
check('chime attempted', chimes > 0);
check('notification sent', FakeNotification.sent.length > 0);
check(
  'stats persisted with 1 focus session',
  (JSON.parse(dom.window.localStorage.getItem('fokus.stats') ?? '{}') as { completedFocusSessions?: number })
    .completedFocusSessions === 1,
);
check(
  'task pomodoro counted',
  (JSON.parse(dom.window.localStorage.getItem('fokus.tasks') ?? '[]') as Array<{ completedPomodoros: number }>)[0]
    ?.completedPomodoros === 1,
);
check('auto-start off by default — break is idle', text().includes('Boshlashga tayyor'));
check('session history recorded', text().includes('Hisobot yozish'));

console.log('\n6. Language switching (instant, persisted)');
const switchLanguage = async (label: string) => {
  await act(async () => {
    const trigger = document.querySelector<HTMLElement>('[aria-haspopup="menu"]');
    trigger!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await wait();
  });
  await act(async () => {
    const item = Array.from(
      document.querySelectorAll<HTMLElement>('[role="menuitemradio"]'),
    ).find((node) => node.textContent?.includes(label));
    item!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await wait();
  });
};
check('language menu is not a native select', document.querySelector('select') === null);
await switchLanguage('Русский');
check('Russian interface', text().includes('Задачи') && text().includes('Короткий перерыв'));
check('html lang updated', document.documentElement.lang === 'ru');
check('language persisted', dom.window.localStorage.getItem('fokus.language') === '"ru"');
await switchLanguage('English');
check('English interface', text().includes('Tasks') && text().includes('Short break'));
check('menu closes after choosing', document.querySelector('[role="menuitemradio"]') === null);

console.log('\n7. Theme toggle (persisted)');
const themeBtn = byLabel('Switch to dark theme');
await act(async () => {
  themeBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait();
});
check('dark theme applied', document.documentElement.dataset.theme === 'dark');
check('theme persisted', dom.window.localStorage.getItem('fokus.theme') === '"dark"');

console.log('\n8. Skip does not count a session');
const skipBtn = byLabel('Skip to the next session');
await act(async () => {
  skipBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait();
});
const statsAfterSkip = JSON.parse(dom.window.localStorage.getItem('fokus.stats') ?? '{}') as {
  completedFocusSessions: number;
  completedBreaks: number;
};
check('skipped break not counted', statsAfterSkip.completedBreaks === 0);
check('back to focus', clockText() === '25:00', clockText());

console.log('\n9. Keyboard shortcut (Space starts the timer)');
await act(async () => {
  document.body.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true }),
  );
  await wait();
});
check('Space started the timer', text().includes('In progress'));

console.log('\n10. Refresh mid-session restores exact remaining time');
advance(10 * 60_000);
await act(async () => {
  await wait(320);
});
const beforeUnmount = clockText();
await act(async () => {
  root.unmount();
  await wait();
});
const root2 = createRoot(document.getElementById('root')!);
await act(async () => {
  root2.render(<App />);
  await wait(320);
});
// Real time passes during the remount, so allow a one-second boundary slip.
const toSeconds = (clock: string) => {
  const [m, sec] = clock.split(':').map(Number);
  return (m ?? 0) * 60 + (sec ?? 0);
};
check(
  `remaining time survived remount (${beforeUnmount})`,
  Math.abs(toSeconds(clockText()) - toSeconds(beforeUnmount)) <= 1,
  clockText(),
);

console.log('\n11. A session that expired while the page was closed is completed on load');
await act(async () => {
  root2.unmount();
  await wait();
});
advance(20 * 60_000);
const root3 = createRoot(document.getElementById('root')!);
await act(async () => {
  root3.render(<App />);
  await wait(500);
});
const statsAfterReload = JSON.parse(dom.window.localStorage.getItem('fokus.stats') ?? '{}') as {
  completedFocusSessions: number;
};
check('expired session recorded exactly once', statsAfterReload.completedFocusSessions === 2, String(statsAfterReload.completedFocusSessions));
check('moved on to a break', text().includes('break') || text().includes('Break'));

console.log('\n12. Corrupt storage cannot break the app');
await act(async () => {
  root3.unmount();
  await wait();
});
dom.window.localStorage.setItem('fokus.settings', '{"focusMinutes":-99,"shortBreakMinutes":"abc","dailyGoal":9999}');
dom.window.localStorage.setItem('fokus.timer', '{"type":"nonsense","status":"weird"}');
dom.window.localStorage.setItem('fokus.tasks', '[{"nope":true},null,5]');
dom.window.localStorage.setItem('fokus.stats', 'not json at all');
const root4 = createRoot(document.getElementById('root')!);
await act(async () => {
  root4.render(<App />);
  await wait(320);
});
check('app still renders', clockText().length === 5, clockText());
check('focus duration clamped to minimum', clockText() === '01:00', clockText());
check('invalid tasks dropped', !text().includes('undefined'));

console.log('\n13. Long-break cycle and auto-start chaining');
await act(async () => {
  root4.unmount();
  await wait();
});
dom.window.localStorage.clear();
dom.window.localStorage.setItem(
  'fokus.settings',
  JSON.stringify({
    focusMinutes: 1,
    shortBreakMinutes: 1,
    longBreakMinutes: 3,
    sessionsBeforeLongBreak: 2,
    dailyGoal: 2,
    soundEnabled: false,
    notificationsEnabled: false,
    autoStartBreaks: true,
    autoStartFocus: true,
  }),
);
dom.window.localStorage.setItem('fokus.language', '"en"');
const root5 = createRoot(document.getElementById('root')!);
await act(async () => {
  root5.render(<App />);
  await wait(320);
});
const start5 = Array.from(document.querySelectorAll('button')).find((b) =>
  b.textContent?.includes('Start'),
);
await act(async () => {
  start5!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait(200);
});
// focus 1 -> short break -> focus 2 -> long break (2 sessions per cycle)
const runOut = async (minutes: number) => {
  advance(minutes * 60_000 + 500);
  await act(async () => {
    await wait(400);
  });
};
await runOut(1);
check('auto-started short break', text().includes('Short break') && text().includes('In progress'));
await runOut(1);
check('auto-started second focus', clockText() === '01:00' && text().includes('In progress'));
await runOut(1);
check('long break after 2 focus sessions', text().includes('Long break'), clockText());
check('long break duration applied', clockText() === '03:00', clockText());
const cycleStats = JSON.parse(dom.window.localStorage.getItem('fokus.stats') ?? '{}') as {
  completedFocusSessions: number;
  completedBreaks: number;
};
check('two focus sessions counted', cycleStats.completedFocusSessions === 2, String(cycleStats.completedFocusSessions));
check('one break counted', cycleStats.completedBreaks === 1, String(cycleStats.completedBreaks));
check('daily goal reached message', text().includes('Daily goal reached'));
await runOut(3);
check('cycle resets to focus after long break', clockText() === '01:00', clockText());

console.log('\n14. A finished day is archived, so weekly totals survive the reset');
await act(async () => {
  root5.unmount();
  await wait();
});
dom.window.localStorage.clear();
dom.window.localStorage.setItem(
  'fokus.settings',
  JSON.stringify({
    focusMinutes: 1,
    shortBreakMinutes: 1,
    longBreakMinutes: 3,
    sessionsBeforeLongBreak: 4,
    dailyGoal: 4,
    soundEnabled: false,
    notificationsEnabled: false,
    autoStartBreaks: false,
    autoStartFocus: false,
  }),
);
dom.window.localStorage.setItem('fokus.language', '"en"');
const root6 = createRoot(document.getElementById('root')!);
await act(async () => {
  root6.render(<App />);
  await wait(320);
});
const start6 = Array.from(document.querySelectorAll('button')).find((b) =>
  b.textContent?.includes('Start'),
);
await act(async () => {
  start6!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait(200);
});
advance(60_000 + 500);
await act(async () => {
  await wait(400);
});
const dayOne = JSON.parse(dom.window.localStorage.getItem('fokus.stats') ?? '{}') as {
  completedFocusSessions: number;
  date: string;
};
check('session counted on day one', dayOne.completedFocusSessions === 1);

// Jump to the next local day and let the tab notice.
advance(24 * 60 * 60_000);
await act(async () => {
  document.dispatchEvent(new dom.window.Event('visibilitychange'));
  await wait(400);
});
const archive = JSON.parse(dom.window.localStorage.getItem('fokus.archive') ?? '[]') as Array<{
  date: string;
  completedFocusSessions: number;
}>;
const dayTwo = JSON.parse(dom.window.localStorage.getItem('fokus.stats') ?? '{}') as {
  completedFocusSessions: number;
  date: string;
};
check('yesterday archived', archive.length === 1 && archive[0]?.completedFocusSessions === 1);
check('archived under its own date', archive[0]?.date === dayOne.date);
check('today starts clean', dayTwo.completedFocusSessions === 0 && dayTwo.date !== dayOne.date);
check('new-day notice shown', text().includes('A new day started'));
check('weekly section still reports the session', text().includes('Last 7 days'));

// Clearing today must not erase the past week.
await act(async () => {
  const resetButton = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Reset statistics'),
  );
  resetButton?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait();
});
const stillArchived = JSON.parse(dom.window.localStorage.getItem('fokus.archive') ?? '[]') as unknown[];
check('archive survives a daily reset', stillArchived.length === 1);

console.log('\n15. Corrupt archive data is ignored, not fatal');
await act(async () => {
  root6.unmount();
  await wait();
});
dom.window.localStorage.setItem('fokus.archive', '[{"date":"nope"},null,42,{"date":"2026-01-02","completedFocusSessions":"x"}]');
const root7 = createRoot(document.getElementById('root')!);
await act(async () => {
  root7.render(<App />);
  await wait(320);
});
check('app renders with corrupt archive', clockText() === '01:00', clockText());
check('bad records dropped', !text().includes('NaN'));

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
