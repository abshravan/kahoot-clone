type Value = string | number | false | null | undefined;

export default function clsx(...parts: Value[]): string {
  return parts.filter(Boolean).join(' ');
}
