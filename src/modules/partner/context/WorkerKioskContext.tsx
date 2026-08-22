import { createContext, useContext, type ReactNode } from 'react';

type WorkerKioskValue = {
  /** Worker being filled by a partner. Null for independent workers / draft add. */
  workerUserId: string | null;
  journeyPath: string;
  includeAccountDetails: boolean;
  myWorkersPath?: string;
  draft?: {
    declarationsDone: boolean;
    accountCreated: boolean;
  };
};

const WorkerKioskContext = createContext<WorkerKioskValue>({
  workerUserId: null,
  journeyPath: '/worker/journey',
  includeAccountDetails: false,
});

export function WorkerKioskProvider({
  workerUserId,
  journeyPath,
  includeAccountDetails = false,
  myWorkersPath,
  draft,
  children,
}: WorkerKioskValue & { children: ReactNode }) {
  return (
    <WorkerKioskContext.Provider
      value={{ workerUserId, journeyPath, includeAccountDetails, myWorkersPath, draft }}
    >
      {children}
    </WorkerKioskContext.Provider>
  );
}

export function useWorkerKiosk(): WorkerKioskValue {
  return useContext(WorkerKioskContext);
}
