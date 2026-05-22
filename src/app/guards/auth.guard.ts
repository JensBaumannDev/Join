import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard function that checks if user is logged in before permitting route activation.
 * Automatically restores session if local credentials exist.
 * 
 * @returns True if the user is authenticated, or a UrlTree to redirect to the login page.
 */
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
