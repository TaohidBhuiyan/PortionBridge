import { Waves, CloudRain, Flame, Building2, Activity, Wind, CloudLightning, TriangleAlert } from 'lucide-react';

/** Icon (lucide component) per disaster type — shared by badges, legend and map markers. */
export const TYPE_ICONS = {
  flood: Waves,
  flash_flood: CloudRain,
  fire: Flame,
  building_collapse: Building2,
  earthquake: Activity,
  cyclone: Wind,
  storm: CloudLightning,
  other: TriangleAlert,
};

export const iconForType = (type) => TYPE_ICONS[type] || TYPE_ICONS.other;
