import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { RaceContextService } from '../services/race-context.service';

export const qualifyingGuard = () => {
  const router = inject(Router);

  const raceContext = inject(RaceContextService);

  if (
    raceContext.navigationStep === 'qualifying' &&
    raceContext.selectedYear &&
    raceContext.selectedRound
  ) {
    return true;
  }

  return router.createUrlTree(['/']);
};
