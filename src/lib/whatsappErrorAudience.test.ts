import assert from "node:assert/strict";
import test from "node:test";
import { shouldOfferWhatsAppErrorHelp } from "./whatsappErrorAudience.ts";

test("workers and guests on public pages can forward an error", () => {
  assert.equal(shouldOfferWhatsAppErrorHelp("/jobs", null), true);
  assert.equal(shouldOfferWhatsAppErrorHelp("/worker/login", "worker"), true);
  assert.equal(shouldOfferWhatsAppErrorHelp("/", "worker"), true);
});

test("staff portals hide the WhatsApp error line before a role loads", () => {
  assert.equal(shouldOfferWhatsAppErrorHelp("/admin/login", null), false);
  assert.equal(shouldOfferWhatsAppErrorHelp("/partner/dashboard", null), false);
  assert.equal(shouldOfferWhatsAppErrorHelp("/employer/login", null), false);
  assert.equal(shouldOfferWhatsAppErrorHelp("/emitra/login", null), false);
  assert.equal(shouldOfferWhatsAppErrorHelp("/interviewer/login", null), false);
});

test("staff roles never see the WhatsApp error line", () => {
  for (const role of ["admin", "partner", "employer", "interviewer"]) {
    assert.equal(shouldOfferWhatsAppErrorHelp("/jobs", role), false);
    assert.equal(shouldOfferWhatsAppErrorHelp("/", role), false);
  }
});
