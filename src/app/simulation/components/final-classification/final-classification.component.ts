import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  RaceClassificationEntry,
  DriverStandingEntry,
  ConstructorStandingEntry,
  FastestLapEntry,
} from '../../../core/models/race-data.model';

import { TEAM_COLORS } from '../../../core/constants/team-data';

import { LeaderboardService } from '../../../core/services/leaderboard.service';
import { RaceFinishService } from '../../../core/services/race-finish.service';

@Component({
  selector: 'app-final-classification',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './final-classification.component.html',

  styleUrls: ['./final-classification.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalClassificationComponent implements OnInit {
  classification: RaceClassificationEntry[] = [];

  driverStandings: DriverStandingEntry[] = [];

  constructorStandings: ConstructorStandingEntry[] = [];

  fastestLap!: FastestLapEntry;

  expandedStandings: 'drivers' | 'constructors' | null = null;

  raceFinished = false;

  constructor(
    private leaderboard: LeaderboardService,
    private raceFinish: RaceFinishService,
  ) {}

  ngOnInit(): void {
    this.classification = this.leaderboard.getOfficialClassification();

    this.driverStandings = this.leaderboard.getDriverStandings();

    this.constructorStandings = this.leaderboard.getConstructorStandings();

    this.fastestLap = this.leaderboard.getFastestLap();

    this.raceFinish.raceFinished$.subscribe((finished) => {
      this.raceFinished = finished;
    });
  }

  getTeamLogo(team: string): string {
    return 'assets/team-logos/' + this.normalizeTeamName(team) + '.svg';
  }

  getTeamLogoClass(team: string): string {
    return this.normalizeTeamName(team);
  }

  getTeamColor(team: string): string {
    return TEAM_COLORS[team] ?? '#888888';
  }

  toggleStandings(type: 'drivers' | 'constructors'): void {
    if (this.expandedStandings === type) {
      this.expandedStandings = null;
      return;
    }

    this.expandedStandings = type;
  }

  isDriversExpanded(): boolean {
    return this.expandedStandings === 'drivers';
  }

  isConstructorsExpanded(): boolean {
    return this.expandedStandings === 'constructors';
  }

  private normalizeTeamName(team: string): string {
    if (team === 'Red Bull Racing') return 'redbull';
    if (team === 'Red Bull') return 'redbull';

    if (team === 'Mercedes') return 'mercedes';

    if (team === 'Ferrari') return 'ferrari';

    if (team === 'McLaren') return 'mclaren';

    if (team === 'Toro Rosso') return 'tororosso';

    if (team === 'AlphaTauri') return 'alphatauri';

    if (team === 'Alfa Romeo' || team === 'Alfa Romeo Racing')
      return 'alfaromeo';

    if (team === 'Alpine' || team === 'Alpine F1 Team') return 'alpine';

    if (team === 'Aston Martin') return 'astonmartin';

    if (team === 'Force India') return 'forceindia';

    if (team === 'Racing Point') return 'racingpoint';

    if (team === 'Williams') return 'williams';

    if (team === 'RB' || team === 'Racing Bulls') {
      return 'racingbulls';
    }

    if (team === 'Kick Sauber') return 'kicksauber';

    if (team === 'Sauber') return 'alfaromeo';

    if (team === 'Renault') return 'renault';

    if (team === 'Haas F1 Team') return 'haas';

    if (team === 'Haas') return 'haas';

    if (team === 'Audi') return 'audi';

    if (team === 'Cadillac') return 'cadillac';

    return 'plcholder';
  }

  onTeamLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;

    img.src = 'assets/team-logos/plcholder.svg';

    img.className = 'plcholder';
  }
}
