import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});

async function shot(name, { width, height, theme, before }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((t) => {
    localStorage.setItem('fokus.theme', JSON.stringify(t));
  }, theme ?? 'light');
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle0' });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  if (before) await before(page);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: `qa/shots/${name}.png`, fullPage: true });
  console.log(`${name}: ${errors.length ? 'CONSOLE ERRORS: ' + errors.join(' | ') : 'clean'}`);
  await page.close();
}

const seed = async (page) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'fokus.tasks',
      JSON.stringify([
        { id: 'a', title: 'Hisobot yakunlash', estimatedPomodoros: 4, completedPomodoros: 2, done: false, createdAt: 1 },
        { id: 'b', title: 'Mijoz bilan qo‘ng‘iroq', estimatedPomodoros: 2, completedPomodoros: 0, done: false, createdAt: 2 },
        { id: 'c', title: 'Pochta javoblari', estimatedPomodoros: 1, completedPomodoros: 1, done: true, createdAt: 3 },
      ]),
    );
    localStorage.setItem('fokus.activeTask', JSON.stringify('a'));
    const now = Date.now();
    localStorage.setItem(
      'fokus.stats',
      JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        completedFocusSessions: 3,
        focusedMs: 75 * 60000,
        completedBreaks: 2,
        history: [
          { id: '1', type: 'focus', endedAt: now - 5400000, durationMs: 1500000, taskTitle: 'Hisobot yakunlash' },
          { id: '2', type: 'shortBreak', endedAt: now - 5100000, durationMs: 300000, taskTitle: null },
          { id: '3', type: 'focus', endedAt: now - 3600000, durationMs: 1500000, taskTitle: 'Hisobot yakunlash' },
          { id: '4', type: 'focus', endedAt: now - 1800000, durationMs: 1500000, taskTitle: 'Pochta javoblari' },
        ],
      }),
    );
  });
  await page.reload({ waitUntil: 'networkidle0' });
};

await shot('desktop-light-empty', { width: 1280, height: 900 });
await shot('desktop-light', { width: 1280, height: 900, before: seed });
await shot('desktop-dark', { width: 1280, height: 900, theme: 'dark', before: seed });
await shot('tablet-light', { width: 834, height: 1000, before: seed });
await shot('mobile-dark', { width: 390, height: 844, theme: 'dark', before: seed });
await shot('mobile-light', { width: 390, height: 844, before: seed });
await shot('desktop-dark-settings', {
  width: 1280,
  height: 900,
  theme: 'dark',
  before: async (page) => {
    await seed(page);
    await page.evaluate(() => {
      const btn = document.querySelector('[aria-label="Sozlamalarni ochish"]');
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 300));
  },
});
await shot('narrow-320', { width: 320, height: 700, before: seed });

await browser.close();
