import type {
  ApiResponse,
  District,
  Skill,
  State,
  WorkerAuthResponse,
  WorkerLoginPayload,
  WorkerGoogleAuthPayload,
  WorkerGoogleAuthResponse,
  WorkerProfile,
  WorkerRegisterPayload,
  SendOtpResponse,
  VerifyOtpResponse,
} from '../types/worker.types';
import type { OnboardingCompleteResult, WorkerOnboardingData } from '../types/onboarding.types';
import { mockWorkerPortal } from './mockWorkerPortal';

const API_BASE = import.meta.env.VITE_WORKER_API_URL || '/api';

const MOCK_FALLBACK_ROUTES = new Set([
  '/workers/otp/send',
  '/workers/otp/verify',
  '/workers/register',
]);

function isHtmlResponse(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function callMockFallback<T>(path: string, options?: RequestInit): T {
  const body = options?.body ? JSON.parse(options.body as string) : {};

  if (path.endsWith('/otp/send')) {
    return mockWorkerPortal.sendOtp(String(body.mobileNumber)) as T;
  }
  if (path.endsWith('/otp/verify')) {
    return mockWorkerPortal.verifyOtp(String(body.mobileNumber), String(body.otp)) as T;
  }
  if (path.endsWith('/register')) {
    return mockWorkerPortal.register(body as WorkerRegisterPayload) as T;
  }

  throw new Error('Worker API is unavailable in demo mode for this action.');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    if (MOCK_FALLBACK_ROUTES.has(path)) {
      return callMockFallback<T>(path, options);
    }
    throw new Error('Worker API is unreachable. Run npm run dev:all locally.');
  }

  const text = await response.text();

  if (isHtmlResponse(text)) {
    if (MOCK_FALLBACK_ROUTES.has(path)) {
      return callMockFallback<T>(path, options);
    }
    throw new Error(
      'Worker API returned an invalid response. Use npm run dev:all locally or deploy the worker API.',
    );
  }

  let body: ApiResponse<T>;
  try {
    body = JSON.parse(text) as ApiResponse<T>;
  } catch {
    if (MOCK_FALLBACK_ROUTES.has(path)) {
      return callMockFallback<T>(path, options);
    }
    throw new Error('Worker API returned an invalid response. Please try again.');
  }

  if (!response.ok || !body.success) {
    const message = body.message || 'Request failed';
    const error = new Error(message) as Error & { errors?: Record<string, string[]> };
    error.errors = body.errors;
    throw error;
  }

  return body.data as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const workerApi = {
  getReferenceData(): Promise<{ states: State[]; skills: Skill[] }> {
    return request('/workers/reference-data');
  },

  getDistricts(stateId: number): Promise<District[]> {
    return request(`/workers/districts/${stateId}`);
  },

  sendOtp(mobileNumber: string): Promise<SendOtpResponse> {
    return request('/workers/otp/send', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber }),
    });
  },

  verifyOtp(mobileNumber: string, otp: string): Promise<VerifyOtpResponse> {
    return request('/workers/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, otp }),
    });
  },

  verifyFirebaseOtp(mobileNumber: string, idToken: string): Promise<VerifyOtpResponse> {
    return request('/workers/otp/verify-firebase', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, idToken }),
    });
  },

  register(payload: WorkerRegisterPayload): Promise<WorkerAuthResponse> {
    return request('/workers/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload: WorkerLoginPayload): Promise<WorkerAuthResponse> {
    return request('/workers/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  googleAuth(payload: WorkerGoogleAuthPayload): Promise<WorkerGoogleAuthResponse> {
    return request('/workers/google-auth', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getProfile(id: number, token: string): Promise<WorkerProfile> {
    return request(`/workers/profile/${id}`, {
      headers: authHeaders(token),
    });
  },

  getOnboarding(token: string): Promise<WorkerOnboardingData> {
    return request('/workers/onboarding', { headers: authHeaders(token) });
  },

  saveOnboardingStep(token: string, payload: Record<string, unknown>): Promise<WorkerOnboardingData> {
    return request('/workers/onboarding/step', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  completeOnboarding(token: string): Promise<OnboardingCompleteResult> {
    return request('/workers/onboarding/complete', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({}),
    });
  },

  advanceToReview(token: string): Promise<WorkerOnboardingData> {
    return request('/workers/onboarding/review', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({}),
    });
  },

  listSkillProofs(token: string): Promise<import('../types/onboarding.types').WorkerSkillProof[]> {
    return request('/workers/onboarding/skills', { headers: authHeaders(token) });
  },

  addSkillProof(
    token: string,
    payload: { skillId: number; experienceYears?: number }
  ): Promise<import('../types/onboarding.types').WorkerSkillProof> {
    return request('/workers/onboarding/skills', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  deleteSkillProof(token: string, proofId: number): Promise<WorkerOnboardingData> {
    return request(`/workers/onboarding/skills/${proofId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },

  async uploadSkillPhoto(token: string, proofId: number, file: File): Promise<import('../types/onboarding.types').WorkerSkillProof> {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_BASE}/workers/onboarding/skills/${proofId}/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.message || 'Photo upload failed');
    }
    return body.data;
  },

  async uploadSkillVideo(token: string, proofId: number, file: File): Promise<import('../types/onboarding.types').WorkerSkillProof> {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_BASE}/workers/onboarding/skills/${proofId}/videos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.message || 'Video upload failed');
    }
    return body.data;
  },

  deleteSkillMedia(
    token: string,
    proofId: number,
    payload: { type: 'photo' | 'video'; mediaUrl: string }
  ): Promise<import('../types/onboarding.types').WorkerSkillProof> {
    return request(`/workers/onboarding/skills/${proofId}/media`, {
      method: 'DELETE',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },
};
