import crypto from 'node:crypto';
import { ValidationException } from '../exception/AppException.js';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface VerifiedToken {
  mobileNumber: string;
  expiresAt: number;
}

const OTP_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getProvider(): string {
  return (process.env.OTP_PROVIDER || '').toLowerCase();
}

function isMockAllowed(): boolean {
  return process.env.OTP_ALLOW_MOCK === 'true';
}

function assertProviderConfigured(): void {
  const provider = getProvider();
  if (provider === 'fast2sms' && process.env.FAST2SMS_API_KEY) return;
  if (provider === 'msg91' && process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) return;
  if (provider === 'mock' && isMockAllowed()) return;

  throw new ValidationException({
    mobileNumber: [
      'OTP provider is not configured. Set OTP_PROVIDER=fast2sms and FAST2SMS_API_KEY in .env (free trial at fast2sms.com), or OTP_PROVIDER=msg91 with MSG91_AUTH_KEY + MSG91_TEMPLATE_ID.',
    ],
  });
}

export class OtpService {
  private readonly pending = new Map<string, OtpRecord>();
  private readonly verifiedTokens = new Map<string, VerifiedToken>();

  async sendOtp(mobileNumber: string): Promise<{ demo?: boolean; message: string }> {
    assertProviderConfigured();
    const provider = getProvider();

    if (provider === 'msg91') {
      await this.msg91SendOtp(mobileNumber);
      return { message: 'OTP sent to your mobile number' };
    }

    const code = this.generateCode();
    this.pending.set(mobileNumber, {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    await this.sendSms(mobileNumber, code);

    if (provider === 'mock' && isMockAllowed()) {
      console.info(`[OTP mock] ${mobileNumber} => ${code}`);
      return {
        demo: true,
        message: 'OTP sent (dev mode — use the code from server logs). Prefer Firebase Phone Auth on the client.',
      };
    }

    return { message: 'OTP sent to your mobile number' };
  }

  verifyOtp(mobileNumber: string, otp: string): { otpToken: string; expiresInSeconds: number } {
    assertProviderConfigured();
    const provider = getProvider();

    if (provider === 'msg91') {
      return this.msg91VerifyOtp(mobileNumber, otp);
    }

    const record = this.pending.get(mobileNumber);
    if (!record) {
      throw new ValidationException({ otp: ['OTP expired or not requested. Tap Send OTP again.'] });
    }

    if (Date.now() > record.expiresAt) {
      this.pending.delete(mobileNumber);
      throw new ValidationException({ otp: ['OTP expired. Request a new one.'] });
    }

    record.attempts += 1;
    if (record.attempts > MAX_ATTEMPTS) {
      this.pending.delete(mobileNumber);
      throw new ValidationException({ otp: ['Too many attempts. Request a new OTP.'] });
    }

    const normalized = otp.replace(/\D/g, '');
    // Never accept arbitrary codes — even in mock, the logged code must match.
    if (normalized !== record.code) {
      throw new ValidationException({ otp: ['Invalid OTP. Please try again.'] });
    }

    this.pending.delete(mobileNumber);
    return this.issueRegistrationToken(mobileNumber);
  }

  issueRegistrationToken(mobileNumber: string): { otpToken: string; expiresInSeconds: number } {
    const otpToken = crypto.randomBytes(24).toString('hex');
    this.verifiedTokens.set(otpToken, {
      mobileNumber,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    });
    return { otpToken, expiresInSeconds: TOKEN_TTL_MS / 1000 };
  }

  consumeRegistrationToken(mobileNumber: string, otpToken: string): void {
    const record = this.verifiedTokens.get(otpToken);
    if (!record || record.mobileNumber !== mobileNumber) {
      throw new ValidationException({
        mobileNumber: ['Mobile number must be verified with OTP before registering'],
      });
    }

    if (Date.now() > record.expiresAt) {
      this.verifiedTokens.delete(otpToken);
      throw new ValidationException({
        mobileNumber: ['Mobile verification expired. Verify your number again.'],
      });
    }

    this.verifiedTokens.delete(otpToken);
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async sendSms(mobileNumber: string, code: string): Promise<void> {
    const provider = getProvider();

    if (provider === 'fast2sms') {
      await this.fast2smsSend(mobileNumber, code);
      return;
    }

    if (provider === 'mock' && isMockAllowed()) {
      return;
    }

    throw new ValidationException({
      mobileNumber: ['OTP SMS provider failed to send. Check API credentials.'],
    });
  }

  private async fast2smsSend(mobileNumber: string, code: string): Promise<void> {
    const apiKey = process.env.FAST2SMS_API_KEY!;
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: code,
        numbers: mobileNumber,
      }),
    });

    const body = (await response.json()) as { return?: boolean; message?: string | string[] };
    if (!response.ok || body.return !== true) {
      const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      throw new ValidationException({
        mobileNumber: [msg || 'Fast2SMS failed to send OTP. Check API key and wallet balance.'],
      });
    }
  }

  private async msg91SendOtp(mobileNumber: string): Promise<void> {
    const response = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        authkey: process.env.MSG91_AUTH_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${mobileNumber}`,
      }),
    });

    const body = (await response.json()) as { type?: string; message?: string };
    if (!response.ok || body.type === 'error') {
      throw new ValidationException({
        mobileNumber: [body.message || 'MSG91 failed to send OTP'],
      });
    }
  }

  private async msg91VerifyOtp(
    mobileNumber: string,
    otp: string
  ): { otpToken: string; expiresInSeconds: number } {
    const params = new URLSearchParams({
      otp: otp.replace(/\D/g, ''),
      mobile: `91${mobileNumber}`,
    });

    const response = await fetch(`https://control.msg91.com/api/v5/otp/verify?${params}`, {
      headers: { authkey: process.env.MSG91_AUTH_KEY! },
    });

    const body = (await response.json()) as { type?: string; message?: string };
    if (!response.ok || body.type === 'error') {
      throw new ValidationException({ otp: [body.message || 'Invalid OTP. Please try again.'] });
    }

    return this.issueRegistrationToken(mobileNumber);
  }
}

export const otpService = new OtpService();
