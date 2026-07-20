import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the WJDR rally timer shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const normalizedHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /<title>同抵集结计时器 \| WJDR<\/title>/i);
  assert.match(normalizedHtml, /同抵集结计时器/);
  assert.match(normalizedHtml, /统一到达时间/);
  assert.match(normalizedHtml, /开始同步计时/);
  assert.match(normalizedHtml, /\+1 分钟/);
  assert.match(normalizedHtml, /\+2 分钟/);
  assert.match(normalizedHtml, /\+3 分钟/);
  assert.match(normalizedHtml, /\+5 分钟/);
  assert.match(normalizedHtml, /仅提醒一次，不进行语音读秒/);
  assert.match(normalizedHtml, /Powered by Linglegl/);
  assert.match(html, /href="\/logo\.jpg"/);
  assert.doesNotMatch(html, /逐秒中文报数|开启语音提醒/);
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("keeps voice alerts concise and completes launched rallies", async () => {
  const source = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /`\$\{nextPlan\.name\}，准备`/);
  assert.match(source, /join\("、"\)\}，发出/);
  assert.match(source, /setFinishedRallyIds\(nextFinishedIds\)/);
  assert.match(source, /该时间已无法到达，请检查时间是否设置正确/);
  assert.doesNotMatch(source, /voiceEnabled|AudioContext|count:\$\{countdown\}/);
});
