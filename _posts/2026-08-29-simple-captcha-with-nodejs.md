---
layout: post
title: "ساخت یک کپچای ساده با Node.js"
date: 2026-08-29
date_label: "۷ شهریور ۱۴۰۵"
lang: fa
direction: rtl
description: "یک کپچای تصویری کوچک با Node.js که خروجی PNG می‌دهد، پاسخ را در Session نگه می‌دارد و تست هم دارد."
excerpt: "بیایید یک کپچای تصویری کوچک با Node.js بسازیم؛ بدون سرویس خارجی و با خروجی PNG واقعی."
image: /assets/images/posts/simple-nodejs-captcha.jpg
image_alt: "تبدیل کاراکترهای کپچا به تصویر پیکسلی در یک دروازه امنیتی دیجیتال"
---

برای یک فرم ساده همیشه لازم نیست سراغ reCAPTCHA یا سرویس‌های مشابه برویم. گاهی
فقط یک مانع کوچک جلوی بات‌های ساده می‌خواهیم و ترجیح می‌دهیم همه‌چیز دست خودمان
باشد.

اینجا یک کپچای کوچک با **Node.js** و **Express** می‌سازیم. سرور یک کد پنج‌حرفی
تولید می‌کند، جواب را داخل Session نگه می‌دارد و یک تصویر **PNG** تحویل مرورگر
می‌دهد. تأکید روی PNG مهم است؛ اگر همان SVG را مستقیم برگردانیم، متن کپچا بدون
هیچ OCRای از سورس پاسخ قابل خواندن است.

چند تصمیمی که برای این نسخه گرفتم:

- تولید کد با ماژول امن `node:crypto` به‌جای `Math.random`
- تبدیل تصویر به PNG باینری با `sharp`
- چرخش جداگانه حروف و اضافه‌کردن خطوط مزاحم تصادفی
- حذف حروف و اعداد مشابه مثل `0`، `O`، `1` و `I`
- نگهداری پاسخ در Session، نه در HTML یا مرورگر
- اعتبار دو دقیقه‌ای و یک‌بارمصرف بودن هر کپچا
- مقایسه پاسخ بدون حساسیت به بزرگی و کوچکی حروف
- تست خودکار برای پاسخ درست، پاسخ اشتباه و استفاده دوباره

> قرار نیست با این کپچا جلوی بات‌های خیلی پیشرفته را بگیریم. برای فرم‌های
> کم‌ریسک و پروژه‌های کوچک جواب می‌دهد، ولی جای rate limit، محافظت CSRF و راهکار
> دسترس‌پذیر را نمی‌گیرد.

## راه‌اندازی پروژه

اول پروژه را می‌سازیم و پکیج‌های مورد نیاز را نصب می‌کنیم:

```bash
mkdir simple-node-captcha
cd simple-node-captcha
npm init -y
npm install express@5.1.0 express-session@1.18.2 sharp@0.35.4
npm install --save-dev supertest@7.1.4
```

بعد `package.json` را به این شکل تغییر می‌دهیم:

```json
{
  "name": "simple-node-captcha",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "5.1.0",
    "express-session": "1.18.2",
    "sharp": "0.35.4"
  },
  "devDependencies": {
    "supertest": "7.1.4"
  }
}
```

ساختار پروژه هم خیلی ساده است:

```text
simple-node-captcha/
├── public/
│   └── index.html
├── test/
│   └── server.test.js
├── package.json
└── server.js
```

## سمت سرور

همه منطق اصلی داخل `server.js` قرار می‌گیرد:

```javascript
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPTCHA_TTL_MS = 2 * 60 * 1000;

export function generateCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from(
    { length: 5 },
    () => alphabet[crypto.randomInt(0, alphabet.length)],
  ).join("");
}

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '\"': "&quot;",
  })[character]);
}

export async function createCaptchaPng(code) {
  const characters = [...code].map((character, index) => {
    const x = 38 + index * 36;
    const y = crypto.randomInt(45, 62);
    const rotation = crypto.randomInt(-18, 19);
    return `<text x="${x}" y="${y}" transform="rotate(${rotation} ${x} ${y})"
      font-family="monospace" font-size="38" font-weight="700"
      fill="#172554">${escapeXml(character)}</text>`;
  }).join("");

  const noise = Array.from({ length: 8 }, () => {
    const x1 = crypto.randomInt(0, 221);
    const y1 = crypto.randomInt(0, 81);
    const x2 = crypto.randomInt(0, 221);
    const y2 = crypto.randomInt(0, 81);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      stroke="#64748b" stroke-width="${crypto.randomInt(1, 3)}" opacity="0.65"/>`;
  }).join("");

  const source = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="80">
      <rect width="220" height="80" rx="12" fill="#f1f5f9"/>
      ${noise}
      ${characters}
    </svg>`;

  return sharp(Buffer.from(source)).png().toBuffer();
}

export function createApp({ makeCode = generateCode } = {}) {
  const app = express();

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET ?? "development-only-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: CAPTCHA_TTL_MS,
    },
  }));
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/captcha.png", async (request, response, next) => {
    const code = makeCode();
    request.session.captcha = {
      code,
      expiresAt: Date.now() + CAPTCHA_TTL_MS,
    };

    try {
      const png = await createCaptchaPng(code);
      response
        .set("Cache-Control", "no-store, private")
        .type("image/png")
        .send(png);
    } catch (error) {
      next(error);
    }
  });

  app.post("/verify-captcha", (request, response) => {
    const savedCaptcha = request.session.captcha;
    delete request.session.captcha;

    const answer = String(request.body.answer ?? "").trim().toUpperCase();
    const isValid = Boolean(
      savedCaptcha
      && savedCaptcha.expiresAt > Date.now()
      && answer.length === savedCaptcha.code.length
      && crypto.timingSafeEqual(
        Buffer.from(answer),
        Buffer.from(savedCaptcha.code),
      ),
    );

    response.status(isValid ? 200 : 400).json({ ok: isValid });
  });

  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
```

ما دو endpoint داریم. `/captcha.png` کد را می‌سازد و همراه زمان انقضا داخل
Session می‌گذارد. بعد برای هر حرف کمی جابه‌جایی و چرخش تصادفی در نظر می‌گیریم،
چند خط هم روی تصویر می‌اندازیم و در آخر با `sharp` آن را به PNG تبدیل می‌کنیم.
در نتیجه چیزی که به مرورگر می‌رسد یک بافر باینری است، نه متن SVG.

endpoint دوم یعنی `/verify-captcha` جواب را چک می‌کند. نکته‌ای که ممکن است راحت
از قلم بیفتد این است که کپچا را قبل از برگرداندن نتیجه از Session پاک می‌کنیم.
پس هر کد فقط یک بار قابل استفاده است؛ حتی اگر جواب درست باشد.

برای مقایسه هم از `timingSafeEqual` استفاده شده. فقط باید قبلش طول دو مقدار را
چک کنیم، چون این تابع با دو Buffer هم‌اندازه کار می‌کند.

## یک فرم ساده برای تست

حالا داخل پوشه `public` یک فایل `index.html` می‌سازیم:

```html
<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>کپچای ساده با Node.js</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; padding: 1rem; }
      form { display: grid; gap: 1rem; }
      img { border: 1px solid #cbd5e1; border-radius: .75rem; }
      input, button { font: inherit; padding: .7rem; }
    </style>
  </head>
  <body>
    <h1>فرم آزمایشی کپچا</h1>
    <form id="captcha-form">
      <img id="captcha-image" src="/captcha.png" alt="کد امنیتی">
      <button type="button" id="refresh">ساخت کد تازه</button>
      <label for="answer">کد داخل تصویر</label>
      <input id="answer" name="answer" required autocomplete="off">
      <button type="submit">بررسی</button>
      <p id="message" role="status"></p>
    </form>
    <script>
      const form = document.querySelector("#captcha-form");
      const image = document.querySelector("#captcha-image");
      const message = document.querySelector("#message");

      function refreshCaptcha() {
        image.src = `/captcha.png?t=${Date.now()}`;
        form.answer.value = "";
      }

      document.querySelector("#refresh").addEventListener("click", refreshCaptcha);

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const response = await fetch("/verify-captcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: form.answer.value }),
        });
        const result = await response.json();
        message.textContent = result.ok ? "کد درست است." : "کد نادرست یا منقضی شده است.";
        refreshCaptcha();
      });
    </script>
  </body>
</html>
```

آن پارامتر `t` انتهای آدرس صرفاً برای دور زدن cache مرورگر است. با هر بار refresh
یک آدرس تازه داریم و مرورگر مجبور می‌شود تصویر جدید را از سرور بگیرد. کوکی
Session هم چون درخواست هم‌مبدأ است، خودکار همراه `fetch` ارسال می‌شود.

## اجرا

برای اجرا یک secret موقت می‌گذاریم و سرور را بالا می‌آوریم:

```bash
SESSION_SECRET="replace-this-with-a-long-random-value" npm start
```

حالا `http://localhost:3000` را باز کنید. دکمه «ساخت کد تازه» هم کد قبلی را
باطل می‌کند و یک تصویر جدید می‌گیرد.

## تستش کنیم

این بخش را بهتر است به تست دستی محدود نکنیم. فایل `test/server.test.js` را اضافه
می‌کنیم تا رفتارهای اصلی همیشه قابل بررسی باشند:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp, generateCode } from "../server.js";

test("generated codes have five unambiguous characters", () => {
  for (let index = 0; index < 100; index += 1) {
    assert.match(generateCode(), /^[2-9A-HJ-NP-Z]{5}$/);
  }
});

test("serves the captcha form", async () => {
  const response = await request(createApp()).get("/").expect(200);
  assert.match(response.headers["content-type"], /text\/html/);
  assert.match(response.text, /id="captcha-form"/);
});

test("returns a binary PNG, accepts the answer, and consumes the captcha", async () => {
  const agent = request.agent(createApp({ makeCode: () => "AB234" }));
  const image = await agent
    .get("/captcha.png")
    .buffer(true)
    .parse((response, callback) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => callback(null, Buffer.concat(chunks)));
    })
    .expect(200);
  assert.match(image.headers["content-type"], /image\/png/);
  assert.deepEqual(image.body.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(image.body.includes(Buffer.from("AB234")), false);

  await agent.post("/verify-captcha").send({ answer: "ab234" }).expect(200, { ok: true });
  await agent.post("/verify-captcha").send({ answer: "AB234" }).expect(400, { ok: false });
});

test("rejects an incorrect answer", async () => {
  const agent = request.agent(createApp({ makeCode: () => "XY789" }));
  await agent.get("/captcha.png").expect(200);
  await agent.post("/verify-captcha").send({ answer: "WRONG" }).expect(400, { ok: false });
});
```

برای تست، تابع `makeCode` را تزریق کرده‌ام تا کد کپچا قابل پیش‌بینی باشد. نسخه
واقعی همچنان تصادفی است، ولی در تست دقیقاً می‌دانیم چه جوابی باید قبول شود.
`request.agent` هم کوکی Session را بین درخواست تصویر و درخواست اعتبارسنجی نگه
می‌دارد.

یک بررسی مهم دیگر هم داخل تست هست: هشت بایت اول خروجی باید امضای PNG باشد و متن
خام `AB234` نباید داخل پاسخ پیدا شود. این همان ایرادی است که در خروجی SVG
داشتیم.

تست‌ها را اجرا کنید:

```bash
npm test
```

اگر همه‌چیز درست باشد، هر چهار تست پاس می‌شوند.

## چند نکته برای production

`express-session` به‌صورت پیش‌فرض اطلاعات را در حافظه نگه می‌دارد. این حالت برای
توسعه خوب است، ولی در production بهتر است store را ببریم روی Redis یا یک
ذخیره‌ساز مشترک دیگر. `SESSION_SECRET` هم باید واقعاً از environment بیاید و
سایت پشت HTTPS باشد.

روی هر دو endpoint حتماً rate limit بگذارید. باینری بودن PNG کار استخراج متن را
سخت‌تر می‌کند، اما کپچا را شکست‌ناپذیر نمی‌کند؛ OCR هنوز وجود دارد. از آن طرف،
کپچای تصویری برای بعضی کاربران قابل استفاده نیست. بسته به حساسیت فرم، یک مسیر
جایگزین مثل لینک ایمیلی، WebAuthn یا کپچای صوتی هم لازم است.

اصل ماجرا همین چند نکته بود: جواب سمت سرور بماند، عمر کوتاه داشته باشد، بعد از
هر تلاش باطل شود و تصویر نهایی متن قابل استخراج نداشته باشد. بقیه‌اش را می‌شود
بسته به نیاز پروژه پیچیده‌تر کرد.
