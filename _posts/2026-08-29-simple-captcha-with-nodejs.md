---
layout: post
title: "ساخت یک کپچای ساده با Node.js"
date: 2026-08-29
date_label: "۷ شهریور ۱۴۰۵"
lang: fa
direction: rtl
description: "ساخت یک کپچای تصویری جمع‌وجور با Node.js؛ بدون سرویس خارجی، با خروجی PNG و چند تست برای بخش‌های مهم."
excerpt: "یک کپچای تصویری جمع‌وجور با Node.js می‌سازیم؛ بدون سرویس خارجی و با خروجی PNG واقعی."
image: /assets/images/posts/simple-nodejs-captcha.jpg
image_alt: "تبدیل کاراکترهای کپچا به تصویر پیکسلی در یک دروازه امنیتی دیجیتال"
---

برای یک فرم ساده همیشه لازم نیست پای reCAPTCHA یا یک سرویس خارجی را وسط بکشیم.
گاهی فقط می‌خواهیم جلوی بات‌های خیلی ساده را بگیریم و کنترل همه‌چیز دست خودمان
باشد.

در این مطلب با **Node.js** و **Express** یک کپچای کوچک می‌سازیم. سرور یک کد
پنج‌کاراکتری تولید می‌کند، جواب را در Session نگه می‌دارد و تصویر **PNG** را به
مرورگر می‌فرستد. PNGبودن خروجی مهم است؛ اگر SVG را مستقیم برگردانیم، متن کپچا
از داخل سورس پیدا می‌شود و حتی نیازی به OCR نیست.

برای این نسخه چند تصمیم ساده گرفتم:

- تولید کد با ماژول امن `node:crypto` به‌جای `Math.random`
- تبدیل تصویر به PNG باینری با `sharp`
- چرخش جداگانه حروف و اضافه‌کردن خطوط مزاحم تصادفی
- حذف حروف و اعداد مشابه مثل `0`، `O`، `1` و `I`
- نگهداری پاسخ در Session، نه در HTML یا مرورگر
- اعتبار دو دقیقه‌ای و یک‌بارمصرف بودن هر کپچا
- مقایسه پاسخ بدون حساسیت به بزرگی و کوچکی حروف
- تست خودکار برای پاسخ درست، پاسخ اشتباه و استفاده دوباره

> این کپچا قرار نیست بات‌های پیشرفته را متوقف کند. برای فرم‌های کم‌ریسک و
> پروژه‌های کوچک بد نیست، اما جای rate limit، محافظت CSRF و یک راهکار
> دسترس‌پذیر را نمی‌گیرد.

## راه‌اندازی پروژه

اول پروژه و پکیج‌های لازم را آماده می‌کنیم:

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

اینجا دو endpoint داریم. `/captcha.png` کد را می‌سازد و همراه زمان انقضا در
Session می‌گذارد. هر حرف کمی جابه‌جا و چرخانده می‌شود، چند خط تصادفی هم روی
تصویر می‌افتد و در آخر `sharp` خروجی را به PNG تبدیل می‌کند. پس چیزی که به
مرورگر می‌رسد یک بافر باینری است، نه متن SVG.

endpoint دوم، یعنی `/verify-captcha`، جواب را بررسی می‌کند. یک جزئیات مهم این
است که کپچا پیش از برگرداندن نتیجه از Session پاک می‌شود. در نتیجه هر کد فقط یک
بار قابل استفاده است؛ حتی وقتی جواب درست باشد.

مقایسه با `timingSafeEqual` انجام می‌شود. فقط قبلش باید طول دو مقدار را چک کنیم،
چون این تابع دو Buffer هم‌اندازه می‌خواهد.

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

پارامتر `t` آخر آدرس فقط برای دورزدن cache مرورگر است. با هر refresh آدرس عوض
می‌شود و مرورگر ناچار است تصویر تازه را از سرور بگیرد. چون درخواست هم‌مبدأ است،
کوکی Session هم خودکار همراه `fetch` فرستاده می‌شود.

## اجرا

برای اجرا یک secret موقت می‌گذاریم و سرور را بالا می‌آوریم:

```bash
SESSION_SECRET="replace-this-with-a-long-random-value" npm start
```

حالا `http://localhost:3000` را باز کنید. دکمه «ساخت کد تازه» کد قبلی را باطل
می‌کند و یک تصویر جدید می‌گیرد.

## تستش کنیم

به تست دستی اکتفا نمی‌کنیم. فایل `test/server.test.js` را اضافه می‌کنیم تا
رفتارهای اصلی را هر بار بتوانیم بررسی کنیم:

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

در تست، تابع `makeCode` را تزریق کرده‌ام تا کد کپچا قابل پیش‌بینی باشد. نسخه
واقعی همچنان تصادفی است، اما اینجا دقیقاً می‌دانیم چه جوابی باید پذیرفته شود.
`request.agent` هم کوکی Session را بین دریافت تصویر و اعتبارسنجی نگه می‌دارد.

یک بررسی مهم دیگر هم داریم: هشت بایت اول خروجی باید امضای PNG باشد و متن خام
`AB234` نباید جایی در پاسخ پیدا شود؛ همان مشکلی که خروجی SVG داشت.

تست‌ها را اجرا کنید:

```bash
npm test
```

اگر همه‌چیز درست باشد، هر چهار تست پاس می‌شوند.

## قبل از استفاده در production

`express-session` به‌صورت پیش‌فرض اطلاعات را در حافظه نگه می‌دارد. برای توسعه
اشکالی ندارد، اما در production بهتر است store را به Redis یا یک ذخیره‌ساز
مشترک دیگر منتقل کنید. `SESSION_SECRET` هم باید از environment بیاید و سایت
پشت HTTPS باشد.

برای هر دو endpoint حتماً rate limit بگذارید. PNG باینری استخراج متن را سخت‌تر
می‌کند، اما کپچا را شکست‌ناپذیر نمی‌کند؛ OCR هنوز می‌تواند وارد بازی شود. از
طرفی کپچای تصویری برای بعضی کاربران قابل استفاده نیست. بسته به حساسیت فرم، یک
راه جایگزین مثل لینک ایمیلی، WebAuthn یا کپچای صوتی هم در نظر بگیرید.

خلاصه اینکه جواب باید سمت سرور بماند، عمر کوتاهی داشته باشد، بعد از هر تلاش باطل
شود و متن خام در تصویر نهایی جا نماند. باقی جزئیات را می‌شود بسته به نیاز پروژه
کم‌وزیاد کرد.
