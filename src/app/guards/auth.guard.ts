import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.currentUser()) {
    await auth.loadSession();
  }

  if (auth.currentUser()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
