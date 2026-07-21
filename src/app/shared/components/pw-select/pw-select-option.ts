export interface PwSelectOption<T = string> {
  value: T;
  label: string;

  accentColor?: string;

  disabled?: boolean;
}
