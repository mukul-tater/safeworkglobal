import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { workerController } from './controller/WorkerController.js';
import { workerOnboardingController } from './controller/WorkerOnboardingController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler } from './exception/errorHandler.js';
import { uploadWorkerPhoto, uploadWorkerVideo, uploadsRoot } from './middleware/uploadMiddleware.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
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

  app.use(errorHandler);

  return app;
}
