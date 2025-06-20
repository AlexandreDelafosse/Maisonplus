export const TEAM_FEATURES = {
  famille: ['calendar', 'tasks', 'notes', 'chat'],
  colocation: ['tasks', 'budget', 'calendar', 'chat'],
  amis: ['chat', 'calendar', 'notes'],
  projet: ['tasks', 'notes', 'calendar'],
} as const;

export type FeatureKey = 'calendar' | 'tasks' | 'notes' | 'chat' | 'budget';
export type PackKey = keyof typeof TEAM_FEATURES;

// ✅ Sécurisé même si `pack` est mal défini
export const hasFeature = (pack: PackKey | undefined, feature: FeatureKey): boolean => {
  const features = TEAM_FEATURES[pack as PackKey];
  return Array.isArray(features) && features.includes(feature);
};
