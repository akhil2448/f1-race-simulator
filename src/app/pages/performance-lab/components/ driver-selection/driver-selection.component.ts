import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface DriverSelection {
  code: string;
  lastName: string;
  team: string;
  teamColor: string;
}

@Component({
  selector: 'app-driver-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-selection.component.html',
  styleUrl: './driver-selection.component.scss',
})
export class DriverSelectionComponent {
  readonly sessions: ('Q1' | 'Q2' | 'Q3')[] = ['Q3', 'Q2', 'Q1'];

  selectedSession: 'Q1' | 'Q2' | 'Q3' = 'Q3';

  selectedYear = 2020;

  selectedRace = 'Styrian Grand Prix';

  selectedDrivers: DriverSelection[] = [];

  drivers: DriverSelection[] = [
    {
      code: 'HAM',
      lastName: 'Hamilton',
      team: 'Mercedes',
      teamColor: '#00D2BE',
    },
    {
      code: 'GIO',
      lastName: 'Giovinazzi',
      team: 'Alfa Romeo',
      teamColor: '#9b0000',
    },
    {
      code: 'VER',
      lastName: 'Verstappen',
      team: 'Red Bull',
      teamColor: '#1E41FF',
    },
    {
      code: 'KVY',
      lastName: 'Kvyat',
      team: 'Toro Rosso',
      teamColor: '#469bff',
    },
    {
      code: 'NOR',
      lastName: 'Norris',
      team: 'McLaren',
      teamColor: '#FF8700',
    },
    {
      code: 'OCO',
      lastName: 'Ocon',
      team: 'Alpine',
      teamColor: '#2293d1',
    },
    {
      code: 'LEC',
      lastName: 'Leclerc',
      team: 'Ferrari',
      teamColor: '#DC0000',
    },
    {
      code: 'GAS',
      lastName: 'Gasly',
      team: 'AlphaTauri',
      teamColor: '#4e7c9b',
    },
    {
      code: 'RIC',
      lastName: 'Ricciardo',
      team: 'Renault',
      teamColor: '#FFF500',
    },
    {
      code: 'LAT',
      lastName: 'Latifi',
      team: 'Williams',
      teamColor: '#37bedd',
    },
    {
      code: 'VET',
      lastName: 'Vettel',
      team: 'Aston Martin',
      teamColor: '#2d826d',
    },
    {
      code: 'HUL',
      lastName: 'Hulkenberg',
      team: 'Audi',
      teamColor: '#F50537',
    },
    {
      code: 'BOT',
      lastName: 'Bottas',
      team: 'Cadillac',
      teamColor: '#909090',
    },
    {
      code: 'PER',
      lastName: 'Perez',
      team: 'Force India',
      teamColor: '#F596C8',
    },
    {
      code: 'ZHO',
      lastName: 'Zhou',
      team: 'Kick Sauber',
      teamColor: '#52e252',
    },
    {
      code: 'ERI',
      lastName: 'Ericsson',
      team: 'Sauber',
      teamColor: '#9B0000',
    },
    {
      code: 'MAG',
      lastName: 'Magnussen',
      team: 'Haas',
      teamColor: '#828282',
    },
    {
      code: 'LAW',
      lastName: 'Lawson',
      team: 'Racing Bulls',
      teamColor: '#6C98FF',
    },
    {
      code: 'STR',
      lastName: 'Stroll',
      team: 'Racing Point',
      teamColor: '#f596c8',
    },
    {
      code: 'SPO',
      lastName: 'Spool',
      team: 'Fake team',
      teamColor: '#f596c8',
    },
  ];

  selectSession(session: 'Q1' | 'Q2' | 'Q3') {
    this.selectedSession = session;

    // Later we'll request backend for drivers in this session.
  }

  selectDriver(driver: DriverSelection): void {
    //
    // Already selected -> remove it.
    //
    const index = this.selectedDrivers.findIndex((d) => d.code === driver.code);

    if (index >= 0) {
      this.selectedDrivers.splice(index, 1);
      return;
    }

    //
    // First driver.
    //
    if (this.selectedDrivers.length === 0) {
      this.selectedDrivers.push(driver);
      return;
    }

    //
    // Second driver.
    //
    if (this.selectedDrivers.length === 1) {
      this.selectedDrivers.push(driver);
      return;
    }

    //
    // Already two drivers.
    // Replace only the second one.
    //
    this.selectedDrivers[1] = driver;
  }

  isSelected(driver: DriverSelection): boolean {
    return this.selectedDrivers.some((d) => d.code === driver.code);
  }

  getTextColor(background: string): string {
    const hex = background.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 120 ? '#111111' : '#FFFFFF';
  }

  getTeamLogo(team: string): string {
    return 'assets/team-logos/' + this.normalizeTeamName(team) + '.svg';
  }

  getTeamLogoClass(team: string): string {
    return this.normalizeTeamName(team);
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

    if (team === 'RB' || team === 'Racing Bulls') return 'racingbulls';

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

  continueToTelemetry() {}
}
