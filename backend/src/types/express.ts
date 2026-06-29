export {};

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      displayName: string | null;
      role: 'learner' | 'admin';
    }

    interface Request {
      user?: User;
      locale?: 'en' | 'vi';
    }
  }
}
