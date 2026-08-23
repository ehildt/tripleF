import { chromium } from 'playwright';

const html = `<!DOCTYPE html><html><body style="margin:0;height:200vh">
<div style="position:relative;overflow-y:auto;height:50vh;border:1px solid">
  <div style="contain:layout style">
    <div style="height:150vh">
      <div style="border:1px solid red">
        <div id="media" style="position:fixed;right:1rem;bottom:1rem;width:10rem;height:5rem;background:green"></div>
      </div>
    </div>
  </div>
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
const before = await page.evaluate(() =>
  document.getElementById('media').getBoundingClientRect().toJSON(),
);
await page.evaluate(() => (document.querySelector('div').scrollTop = 300));
const after = await page.evaluate(() =>
  document.getElementById('media').getBoundingClientRect().toJSON(),
);
console.log('before scroll:', before);
console.log('after scroll:', after);
console.log(
  before.bottom === after.bottom
    ? 'FIXED TO VIEWPORT (ok)'
    : 'CONTAINED (broken)',
);
await browser.close();
