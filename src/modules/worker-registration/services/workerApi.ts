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

const MOCK_FALLBACK_ROUTES = new Set(['/workers/register']);

function isHtmlResponse(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function callMockFallback<T>(path: string, options?: RequestInit): T {
  const body = options?.body ? JSON.parse(options.body as string) : {};

  if (path.endsWith('/register')) {
    return mockWorkerPortal.register(body as WorkerRegisterPayload) as T;
  }

  throw new Error(
    'Phone verification needs the worker API. Run npm run dev:all.',
  );
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

  /** @deprecated UI uses Firebase Phone Auth; prefer verifyFirebaseOtp. */
  sendOtp(mobileNumber: string): Promise<SendOtpResponse> {
    return request('/workers/otp/send', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber }),
    });
  },

  /** @deprecated UI uses Firebase Phone Auth; prefer verifyFirebaseOtp. */
  verifyOtp(mobileNumber: string, otp: string): Promise<VerifyOtpResponse> {
    return request('/workers/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, otp }),
    });
  },

  verifyFirebaseOtp(mobileNumber: string, idToken: string): Promise<VerifyOtpResponse> {
    return request<VerifyOtpResponse>('/workers/otp/verify-firebase', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, idToken }),
    }).then((result) => {
      mockWorkerPortal.stashVerifiedToken(mobileNumber, result.otpToken);
      return result;
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

  checkJobApplication(token: string, jobId: string): Promise<{ applied: boolean; applicationId?: number }> {
    return request(`/workers/applications/status?jobId=${encodeURIComponent(jobId)}`, {
      headers: authHeaders(token),
    });
  },

  applyToJob(
    token: string,
    payload: { jobId: string; employerId: string; coverLetter?: string }
  ): Promise<{ id: number }> {
    return request('/workers/applications', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },
};
