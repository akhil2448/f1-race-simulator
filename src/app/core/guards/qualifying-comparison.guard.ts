import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { RaceContextService } from '../services/race-context.service';

export const qualifyingComparisonGuard = () => {
  const router = inject(Router);

  const raceContext = inject(RaceContextService);

  if (
    raceContext.navigationStep === 'qualifying-comparison' &&
    raceContext.comparison
  ) {
    return true;
  }

  return router.createUrlTree(['/']);
};
