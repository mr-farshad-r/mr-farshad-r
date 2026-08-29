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
