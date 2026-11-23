// default-categories.ts -- the starter categories a NEW site gets when its first admin is created.
//
// A fresh install has an empty Category table, so the category filter and the home page categories
// would be empty until an admin added some. These are the same nine auto-service categories as
// frontend/src/data/autoCategories.ts and prisma/seed.ts (ids equal slugify(label), so listings
// that already use them line up). The parent comes first, because the children point at it.
// An admin can rename, reorder or delete all of them under Admin -> Categories.
export interface DefaultCategory {
  id: string;
  label: string;
  icon?: string;
  order: number;
  parentId?: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: 'auto', label: 'Auto', order: 0 },
  { id: 'auto-garage', label: 'Auto Garage', icon: 'Wrench', order: 0, parentId: 'auto' },
  { id: 'heavy-vehicle-garage', label: 'Heavy Vehicle Garage', icon: 'Truck', order: 1, parentId: 'auto' },
  { id: 'bike-garage', label: 'Bike Garage', icon: 'Bike', order: 2, parentId: 'auto' },
  { id: 'auto-parts', label: 'Auto Parts', icon: 'PackageSearch', order: 3, parentId: 'auto' },
  { id: 'auto-recondition', label: 'Auto Recondition', icon: 'Sparkles', order: 4, parentId: 'auto' },
  { id: 'auto-rental', label: 'Auto Rental', icon: 'Car', order: 5, parentId: 'auto' },
  { id: 'denting-painting', label: 'Denting & Painting', icon: 'PaintBucket', order: 6, parentId: 'auto' },
  { id: 'washing-center', label: 'Washing Center', icon: 'Droplets', order: 7, parentId: 'auto' },
  { id: 'electric-vehicle-garage', label: 'Electric Vehicle Garage', icon: 'Zap', order: 8, parentId: 'auto' },
];
