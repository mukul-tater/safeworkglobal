const NOTICE_ACK_KEY = "swg_emitra_onboard_notice_ack";

/** Basic password the eMitra agent can write down; worker can change it later. */
export function suggestEmitraWorkerPassword(): string {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const n = ((bytes[0] << 8) | bytes[1]) % 9000 + 1000;
  return `SwgWorker${n}Aa`;
}

export function hasAckedEmitraOnboardingNotice(): boolean {
  try {
    return sessionStorage.getItem(NOTICE_ACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function ackEmitraOnboardingNotice() {
  try {
    sessionStorage.setItem(NOTICE_ACK_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
