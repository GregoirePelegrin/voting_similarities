export const GROUP_POLITICAL_ORDER = [
  "LFI",
  "GDR",
  "Eco",
  "Soc",
  "LIOT",
  "Dem",
  "Ens",
  "Hor",
  "Rep",
  "UDR",
  "RN",
  "NI",
];

export function sortGroupsByPoliticalOrder<T extends {name_short?: string | null}>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ia = a.name_short ? GROUP_POLITICAL_ORDER.indexOf(a.name_short) : -1;
    const ib = b.name_short ? GROUP_POLITICAL_ORDER.indexOf(b.name_short) : -1;
    return (ia === -1 ? GROUP_POLITICAL_ORDER.length : ia) - (ib === -1 ? GROUP_POLITICAL_ORDER.length : ib);
  });
}
