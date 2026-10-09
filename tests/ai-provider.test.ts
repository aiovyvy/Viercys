import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  answerConcierge,
  requestStructuredSuggestion,
} from "../src/ai/provider";
const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENAI_API_KEY;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
});
test("missing API credentials return fallback without network access", async () => {
  delete process.env.OPENAI_API_KEY;
  globalThis.fetch = async () => {
    throw new Error("Network should not be called");
  };
  assert.equal(await answerConcierge("How do I book?", {}), null);
});
test("configured concierge sends strict structured output and validates answer", async () => {
  process.env.OPENAI_API_KEY = "test-only-key";
  let received: Record<string, unknown> | undefined;
  globalThis.fetch = async (_input, options) => {
    received = JSON.parse(String(options?.body));
    return new Response(
      JSON.stringify({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  answer:
                    "Use Check availability to compare rooms. Suggestions do not make a reservation.",
                }),
              },
            ],
          },
        ],
      }),
    );
  };
  assert.match(
    (await answerConcierge("How do I book?", { property: "Santorini" })) || "",
    /Check availability/,
  );
  assert.equal(received?.store, false);
  assert.deepEqual(
    (received?.text as { format: { strict: boolean } }).format.strict,
    true,
  );
  assert.equal(received?.tools, undefined);
});
test("provider errors, refusals, invalid shapes and transactional claims use fallback", async () => {
  process.env.OPENAI_API_KEY = "test-only-key";
  const payloads = [
    { status: "incomplete", output: [] },
    {
      status: "completed",
      output: [
        {
          type: "message",
          content: [{ type: "refusal", refusal: "Cannot help" }],
        },
      ],
    },
    {
      status: "completed",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: '{"answer":42}' }],
        },
      ],
    },
    {
      status: "completed",
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: '{"answer":"I have booked your sailing trip."}',
            },
          ],
        },
      ],
    },
  ];
  for (const payload of payloads) {
    globalThis.fetch = async () => new Response(JSON.stringify(payload));
    assert.equal(await answerConcierge("Book a trip", {}), null);
  }
  globalThis.fetch = async () => new Response("{}", { status: 429 });
  assert.equal(await answerConcierge("Hello", {}), null);
  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };
  assert.equal(await answerConcierge("Hello", {}), null);
});
test("structured itinerary helper enforces caller runtime validation", async () => {
  process.env.OPENAI_API_KEY = "test-only-key";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: '{"days":[]}' }],
          },
        ],
      }),
    );
  const value = await requestStructuredSuggestion<{ days: string[] }>({
    prompt: "Plan a day",
    context: {},
    schema: { type: "object" },
    validate: (data): data is { days: string[] } =>
      typeof data === "object" &&
      data !== null &&
      "days" in data &&
      Array.isArray(data.days) &&
      data.days.length === 1,
  });
  assert.equal(value, null);
});
