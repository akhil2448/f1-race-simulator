import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { PwSelectOption } from './pw-select-option';

@Component({
  selector: 'app-pw-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pw-select.component.html',
  styleUrl: './pw-select.component.scss',
})
export class PwSelectComponent<T> implements AfterViewChecked {
  @Input() options: PwSelectOption<T>[] = [];

  @Input() placeholder = 'Select';

  private _value: T | null = null;

  @Input()
  set value(value: T | null) {
    this._value = value;
  }

  get value(): T | null {
    return this._value;
  }

  @Input() searchable = false;

  @Output() valueChange = new EventEmitter<T>();

  @ViewChild('dropdown')
  dropdown?: ElementRef<HTMLDivElement>;

  @ViewChild('searchInput')
  searchInput?: ElementRef<HTMLInputElement>;

  isOpen = false;

  searchText = '';
  filteredOptions: PwSelectOption<T>[] = [];

  highlightedIndex = -1;

  openUpwards = false;
  private pendingScroll = false;
  private pendingFocus = false;

  @HostListener('window:resize')
  onResize(): void {
    this.close();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.close();
  }

  constructor(private host: ElementRef<HTMLElement>) {}

  get selectedOption(): PwSelectOption<T> | undefined {
    return this.options.find((o) => o.value === this.value);
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    this.calculateDirection();

    this.isOpen = true;

    this.searchText = '';
    this.filteredOptions = [...this.options];

    this.highlightedIndex = this.filteredOptions.findIndex(
      (o) => o.value === this.value,
    );

    if (this.highlightedIndex < 0 && this.filteredOptions.length > 0) {
      this.highlightedIndex = 0;
    }

    this.pendingScroll = true;

    if (this.searchable) {
      this.pendingFocus = true;
    }
  }

  close(): void {
    this.isOpen = false;
  }

  select(option: PwSelectOption<T>): void {
    if (option.disabled) {
      return;
    }

    this.value = option.value;

    this.valueChange.emit(option.value);

    this.close();
  }

  private calculateDirection(): void {
    const rect = this.host.nativeElement.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;

    this.openUpwards = spaceBelow < 340;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown'
      ) {
        event.preventDefault();
        this.open();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        this.close();
        break;

      case 'ArrowDown':
        event.preventDefault();

        this.highlightedIndex = Math.min(
          this.filteredOptions.length - 1,
          this.highlightedIndex + 1,
        );

        this.pendingScroll = true;
        break;

      case 'ArrowUp':
        event.preventDefault();

        this.highlightedIndex = Math.max(0, this.highlightedIndex - 1);

        this.pendingScroll = true;
        break;

      case 'Enter':
        event.preventDefault();

        if (this.highlightedIndex >= 0) {
          this.select(this.filteredOptions[this.highlightedIndex]);
        }

        break;
    }
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.filterOptions();
  }

  private filterOptions(): void {
    const query = this.searchText.trim().toLowerCase();

    if (!query) {
      this.filteredOptions = [...this.options];
    } else {
      this.filteredOptions = this.options.filter((option) => {
        const keywords = option.keywords ?? [option.label];

        return keywords.some((keyword) =>
          keyword.toLowerCase().includes(query),
        );
      });

      // If nothing matches, show all drivers again.
      if (this.filteredOptions.length === 0) {
        this.filteredOptions = [...this.options];
      }
    }

    this.highlightedIndex = this.filteredOptions.length > 0 ? 0 : -1;

    this.pendingScroll = true;
  }

  ngAfterViewChecked(): void {
    if (this.pendingFocus && this.searchInput) {
      this.pendingFocus = false;
      this.searchInput.nativeElement.focus();
    }

    if (!this.pendingScroll || !this.dropdown) {
      return;
    }

    this.pendingScroll = false;

    const container = this.dropdown.nativeElement;

    const highlighted = container.querySelector<HTMLElement>(
      '.option.highlighted',
    );

    highlighted?.scrollIntoView({
      block: 'nearest',
    });
  }
}
