import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { RaceContextService } from '../services/race-context.service';

export const raceComparisonGuard = () => {
  const router = inject(Router);

  const raceContext = inject(RaceContextService);

  if (
    raceContext.navigationStep === 'race-comparison' &&
    raceContext.comparison
  ) {
    return true;
  }

  return router.createUrlTree(['/']);
};
