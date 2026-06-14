// import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

// import { CommonModule } from '@angular/common';

// import { RaceClassificationEntry } from '../../../core/models/race-data.model';

// import { LeaderboardService } from '../../../core/services/leaderboard.service';

// @Component({
//   selector: 'app-final-classification',

//   standalone: true,

//   imports: [CommonModule],

//   templateUrl: './final-classification.component.html',

//   styleUrls: ['./final-classification.component.scss'],

//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class FinalClassificationComponent implements OnInit {
//   classification: RaceClassificationEntry[] = [];

//   constructor(private leaderboard: LeaderboardService) {}

//   ngOnInit(): void {
//     this.classification = this.leaderboard.getOfficialClassification();
//   }

//   getTeamLogo(team: string): string {
//     return 'assets/team-logos/' + team + '.svg';
//   }

//   onTeamLogoError(event: Event): void {
//     const img = event.target as HTMLImageElement;

//     img.src = 'assets/team-logos/plcholder.svg';

//     img.className = 'plcholder';
//   }
// }

// TEST DATA

import { Component, ChangeDetectionStrategy } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RaceClassificationEntry } from '../../../core/models/race-data.model';

import { TEAM_COLORS } from '../../../core/constants/team-data';

@Component({
  selector: 'app-final-classification',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './final-classification.component.html',

  styleUrls: ['./final-classification.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalClassificationComponent {
  classification: RaceClassificationEntry[] = [
    {
      driver: 'HAM',
      fullName: 'Lewis Hamilton',
      driverNumber: '44',
      team: 'Mercedes',
      position: 1,
      status: 'FINISHED',
      statusText: 'Finished',
      displayGap: 'WINNER',
      finishTime: 5532,
      gapToLeader: 0,
      lapsCompleted: 70,
      lapsDown: 0,
      points: 25,
    },

    {
      driver: 'VER',
      fullName: 'Max Verstappen',
      driverNumber: '33',
      team: 'Red Bull Racing',
      position: 2,
      status: 'FINISHED',
      statusText: 'Finished',
      displayGap: '+8.421',
      finishTime: 5540,
      gapToLeader: 8.421,
      lapsCompleted: 70,
      lapsDown: 0,
      points: 18,
    },

    {
      driver: 'LEC',
      fullName: 'Charles Leclerc',
      driverNumber: '16',
      team: 'Ferrari',
      position: 3,
      status: 'FINISHED',
      statusText: 'Finished',
      displayGap: '+14.932',
      finishTime: 5547,
      gapToLeader: 14.932,
      lapsCompleted: 70,
      lapsDown: 0,
      points: 15,
    },

    {
      driver: 'NOR',
      fullName: 'Lando Norris',
      driverNumber: '4',
      team: 'McLaren',
      position: 4,
      status: 'FINISHED',
      statusText: 'Finished',
      displayGap: '+18.441',
      finishTime: 5550,
      gapToLeader: 18.441,
      lapsCompleted: 70,
      lapsDown: 0,
      points: 12,
    },

    {
      driver: 'ALO',
      fullName: 'Fernando Alonso',
      driverNumber: '14',
      team: 'Aston Martin',
      position: 5,
      status: 'FINISHED',
      statusText: 'Finished',
      displayGap: '+1 LAP',
      finishTime: 5601,
      gapToLeader: null,
      lapsCompleted: 69,
      lapsDown: 1,
      points: 10,
    },

    {
      driver: 'TSU',
      fullName: 'Yuki Tsunoda',
      driverNumber: '22',
      team: 'RB',
      position: 6,
      status: 'OUT',
      statusText: 'DNF',
      displayGap: 'DNF',
      finishTime: null,
      gapToLeader: null,
      lapsCompleted: 51,
      lapsDown: 19,
      points: 8,
    },
    {
      driver: 'GAS',
      fullName: 'Pierre Gasly',
      driverNumber: '10',
      team: 'Alpine',
      position: 7,
      status: 'OUT',
      statusText: 'DNF',
      displayGap: 'DNF',
      finishTime: null,
      gapToLeader: null,
      lapsCompleted: 51,
      lapsDown: 19,
      points: 6,
    },
    {
      driver: 'ALB',
      fullName: 'Alexander Albon',
      driverNumber: '23',
      team: 'Williams',
      position: 8,
      status: 'OUT',
      statusText: 'DNF',
      displayGap: 'DNF',
      finishTime: null,
      gapToLeader: null,
      lapsCompleted: 51,
      lapsDown: 19,
      points: 4,
    },
    {
      driver: 'OCO',
      fullName: 'Estaban Ocon',
      driverNumber: '31',
      team: 'Haas F1 Team',
      position: 9,
      status: 'OUT',
      statusText: 'DNF',
      displayGap: 'DNF',
      finishTime: null,
      gapToLeader: null,
      lapsCompleted: 51,
      lapsDown: 19,
      points: 2,
    },

    {
      driver: 'BOT',
      fullName: 'Valtarri Botas',
      driverNumber: '77',
      team: 'Renault',
      position: 10,
      status: 'OUT',
      statusText: 'DNF',
      displayGap: 'DNF',
      finishTime: null,
      gapToLeader: null,
      lapsCompleted: 51,
      lapsDown: 19,
      points: 1,
    },
  ];

  getTeamLogo(team: string): string {
    return 'assets/team-logos/' + this.normalizeTeamName(team) + '.svg';
  }

  getTeamLogoClass(team: string): string {
    return this.normalizeTeamName(team);
  }

  getTeamColor(team: string): string {
    return TEAM_COLORS[team] ?? '#888888';
  }

  private normalizeTeamName(team: string): string {
    if (team === 'Red Bull Racing') return 'redbull';

    if (team === 'Mercedes') return 'mercedes';

    if (team === 'Ferrari') return 'ferrari';

    if (team === 'McLaren') return 'mclaren';

    if (team === 'Toro Rosso') return 'tororosso';

    if (team === 'AlphaTauri') return 'alphatauri';

    if (team === 'Alpine') return 'alpine';

    if (team === 'Aston Martin') return 'astonmartin';

    if (team === 'Force India') return 'forceindia';

    if (team === 'Racing Point') return 'racingpoint';

    if (team === 'Williams') return 'williams';

    if (team === 'RB' || team === 'Racing Bulls') return 'racingbulls';

    if (team === 'Kick Sauber') return 'kicksauber';

    if (team === 'Sauber') return 'sauber';

    if (team === 'Renault') return 'renault';

    if (team === 'Haas F1 Team') return 'haas';

    return 'plcholder';
  }

  onTeamLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;

    img.src = 'assets/team-logos/plcholder.svg';

    img.className = 'plcholder';
  }
}
