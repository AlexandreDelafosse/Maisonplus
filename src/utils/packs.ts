export const PACKS = {
  famille: {
    label: 'Famille',
    features: ['calendar', 'tasks', 'notes', 'chat'],
  },
  coloc: {
    label: 'Colocation',
    features: ['tasks', 'budget', 'calendar', 'chat'],
  },
  amis: {
    label: 'Amis proches',
    features: ['chat', 'calendar', 'notes'],
  },
  projet: {
    label: 'Projet/Association',
    features: ['tasks', 'notes', 'calendar'],
  },
} as const;

export type TeamPack = keyof typeof PACKS;
// "famille" | "coloc" | "amis" | "projet"
