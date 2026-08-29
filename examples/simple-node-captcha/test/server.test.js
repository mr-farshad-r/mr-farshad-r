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
