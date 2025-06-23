export const TEAM_FEATURES = {
  famille: ['tasks', 'calendar', 'notes', 'chat', 'ideas'],
  coloc: ['tasks', 'budget', 'calendar', 'chat', 'ideas'],
  amis: ['chat', 'calendar', 'ideas'],
  projet: ['tasks', 'calendar', 'notes', 'ideas'],
} as const;

export type FeatureKey = 'tasks' | 'calendar' | 'notes' | 'budget' | 'chat' | 'ideas';

export type PackKey = keyof typeof TEAM_FEATURES;

// ✅ Sécurisé même si `pack` est mal défini
export const hasFeature = (pack: PackKey | undefined, feature: FeatureKey): boolean => {
  const features = TEAM_FEATURES[pack as PackKey];
  return Array.isArray(features) && features.includes(feature);
};
