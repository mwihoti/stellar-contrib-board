export function truncateAddress(address: string): string {
  return `${address.slice(0, 5)}…${address.slice(-5)}`;
}
