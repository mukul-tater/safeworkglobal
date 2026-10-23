import assert from "node:assert/strict";
import test from "node:test";
import { shouldOfferWhatsAppErrorHelp } from "./whatsappErrorAudience.ts";

test("errors never add the WhatsApp forwarding prompt", () => {
  for (const role of [null, "worker", "admin", "employer"]) {
    assert.equal(shouldOfferWhatsAppErrorHelp("/jobs", role), false);
    assert.equal(shouldOfferWhatsAppErrorHelp("/worker/journey", role), false);
    assert.equal(shouldOfferWhatsAppErrorHelp("/admin", role), false);
  }
});
