import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { workerController } from './controller/WorkerController.js';
import { workerOnboardingController } from './controller/WorkerOnboardingController.js';
import { workerJobApplicationController } from './controller/WorkerJobApplicationController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler } from './exception/errorHandler.js';
import { uploadWorkerPhoto, uploadWorkerVideo, uploadsRoot } from './middleware/uploadMiddleware.js';

function corsOriginOption(): boolean | string | string[] {
  const configured = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  // Local/dev only — never reflect arbitrary origins in production
  if (process.env.NODE_ENV !== 'production') {
    return ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
  }

  return false;
}

export function createApp() {
  const app = express();

  app.use(cors({ origin: corsOriginOption(), credentials: true }));
  app.use(express.json());

  app.use('/uploads', express.static(uploadsRoot));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok' });
  });

  app.get('/api/workers/reference-data', workerController.getReferenceData);
  app.get('/api/workers/districts/:stateId', workerController.getDistricts);
  app.post('/api/workers/otp/send', workerController.sendOtp);
  app.post('/api/workers/otp/verify', workerController.verifyOtp);
  app.post('/api/workers/otp/verify-firebase', workerController.verifyFirebaseOtp);
  app.post('/api/bond/guarantor-otp/send', workerController.sendGuarantorOtp);
  app.post('/api/bond/guarantor-otp/verify', workerController.verifyGuarantorOtp);
  app.post('/api/workers/register', workerController.register);
  app.post('/api/workers/login', workerController.login);
  app.post('/api/workers/google-auth', workerController.googleAuth);
  app.get('/api/workers/profile/:id', workerController.getProfile);

  app.get('/api/workers/onboarding', authMiddleware, workerOnboardingController.getOnboarding);
  app.put('/api/workers/onboarding/step', authMiddleware, workerOnboardingController.saveStep);
  app.get('/api/workers/onboarding/skills', authMiddleware, workerOnboardingController.listSkillProofs);
  app.post('/api/workers/onboarding/skills', authMiddleware, workerOnboardingController.addSkillProof);
  app.delete(
    '/api/workers/onboarding/skills/:proofId',
    authMiddleware,
    workerOnboardingController.deleteSkillProof
  );
  app.post(
    '/api/workers/onboarding/skills/:proofId/photos',
    authMiddleware,
    uploadWorkerPhoto.single('file'),
    workerOnboardingController.uploadPhoto
  );
  app.post(
    '/api/workers/onboarding/skills/:proofId/videos',
    authMiddleware,
    uploadWorkerVideo.single('file'),
    workerOnboardingController.uploadVideo
  );
  app.delete(
    '/api/workers/onboarding/skills/:proofId/media',
    authMiddleware,
    workerOnboardingController.deleteSkillMedia
  );
  app.post(
    '/api/workers/onboarding/review',
    authMiddleware,
    workerOnboardingController.advanceToReview
  );
  app.post('/api/workers/onboarding/complete', authMiddleware, workerOnboardingController.complete);

  app.get(
    '/api/workers/applications/status',
    authMiddleware,
    workerJobApplicationController.getStatus
  );
  app.post('/api/workers/applications', authMiddleware, workerJobApplicationController.apply);

  app.use(errorHandler);

  return app;
}
