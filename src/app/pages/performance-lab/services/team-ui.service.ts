import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TeamUiService {
  normalizeColor(color: string): string {
    return color.startsWith('#') ? color : `#${color}`;
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
    return `assets/team-logos/${this.getTeamLogoClass(team)}.svg`;
  }

  getTeamLogoClass(team: string): string {
    switch (team) {
      case 'Red Bull Racing':
      case 'Red Bull':
        return 'redbull';

      case 'Mercedes':
        return 'mercedes';

      case 'Ferrari':
        return 'ferrari';

      case 'McLaren':
        return 'mclaren';

      case 'Toro Rosso':
        return 'tororosso';

      case 'AlphaTauri':
        return 'alphatauri';

      case 'Alfa Romeo':
      case 'Alfa Romeo Racing':
        return 'alfaromeo';

      case 'Alpine':
      case 'Alpine F1 Team':
        return 'alpine';

      case 'Aston Martin':
        return 'astonmartin';

      case 'Force India':
        return 'forceindia';

      case 'Racing Point':
        return 'racingpoint';

      case 'Williams':
        return 'williams';

      case 'RB':
      case 'Racing Bulls':
        return 'racingbulls';

      case 'Kick Sauber':
        return 'kicksauber';

      case 'Sauber':
        return 'alfaromeo';

      case 'Renault':
        return 'renault';

      case 'Haas':
      case 'Haas F1 Team':
        return 'haas';

      case 'Audi':
        return 'audi';

      case 'Cadillac':
        return 'cadillac';

      default:
        return 'plcholder';
    }
  }

  onTeamLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;

    img.src = 'assets/team-logos/plcholder.svg';
    img.className = 'plcholder';
  }
}
