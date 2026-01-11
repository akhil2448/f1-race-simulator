import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { RaceSelectionComponent } from './pages/race-selection/race-selection.component';
import { SimulationComponent } from './pages/simulation/simulation.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'select-race', component: RaceSelectionComponent },
      { path: 'simulate', component: SimulationComponent },
    ],
  },
];
