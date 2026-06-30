import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { RaceSelectionComponent } from './pages/race-selection/race-selection.component';
import { SimulationComponent } from './pages/simulation/simulation.component';
import { QualifyingComponent } from './pages/qualifying/qualifying.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

import { selectRaceGuard } from './core/guards/select-race.guard';
import { qualifyingGuard } from './core/guards/qualifying.guard';
import { simulationGuard } from './core/guards/simulation.guard';
import { QualifyingComparisonPageComponent } from './pages/qualifying-comparison-page/qualifying-comparison-page.component';
import { PerformanceLabComponent } from './pages/performance-lab/performance-lab.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      {
        path: 'select-race',
        component: RaceSelectionComponent,
        canActivate: [selectRaceGuard],
      },
      {
        path: 'qualifying/:year/:round',
        component: QualifyingComponent,
        canActivate: [qualifyingGuard],
      },
      {
        path: 'simulation',
        component: SimulationComponent,
        canActivate: [simulationGuard],
      },
      {
        path: 'ultimate-pace',
        component: QualifyingComparisonPageComponent,
      },
      { path: 'performance-lab', component: PerformanceLabComponent },
      {
        path: '**',
        component: NotFoundComponent,
      },
    ],
  },
];
