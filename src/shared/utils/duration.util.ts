export function parseDurationToSeconds(value: string | undefined, defaultSeconds: number): number {
  if (!value) {
    return defaultSeconds;
  }

  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    return defaultSeconds;
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 24 * 60 * 60;
    default:
      return defaultSeconds;
  }
}
