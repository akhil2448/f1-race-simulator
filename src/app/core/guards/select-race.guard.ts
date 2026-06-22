import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { RaceContextService } from '../services/race-context.service';

export const selectRaceGuard = () => {
  const router = inject(Router);

  const raceContext = inject(RaceContextService);

  if (raceContext.navigationStep === 'race-selection') {
    return true;
  }

  return router.createUrlTree(['/']);
};
