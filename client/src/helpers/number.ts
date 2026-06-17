const formatter = new Intl.NumberFormat("en-US", {
  notation: "standard",
  maximumFractionDigits: 1,
});

export function formatNumber(num: number): string {
  return formatter.format(num);
}
