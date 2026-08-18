import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { RaceContextService } from '../services/race-context.service';

export const performanceLabGuard = () => {
  const router = inject(Router);
  const raceContext = inject(RaceContextService);

  const navigation = router.getCurrentNavigation();

  const isBrowserNavigation = navigation?.trigger === 'popstate';

  if (
    raceContext.selectedYear &&
    raceContext.selectedRound &&
    (raceContext.navigationStep === 'performance-lab' || isBrowserNavigation)
  ) {
    return true;
  }

  return router.createUrlTree(['/']);
};
