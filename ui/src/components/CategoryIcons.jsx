const ICONS = {
  produce: (
    <>
      <path d="M9 9h6l-2.2 10.5a1 1 0 0 1-1.6 0L9 9z" strokeLinejoin="round" />
      <path d="M12 9V5M10 7L8.5 5M14 7L15.5 5" strokeLinecap="round" />
    </>
  ),
  dairy: (
    <>
      <path d="M8 4h8v3l-1 13H9L8 7V4z" strokeLinejoin="round" />
      <path d="M8 10h8" strokeLinecap="round" />
    </>
  ),
  snacks: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="9.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  noodles: (
    <>
      <ellipse cx="12" cy="11.5" rx="9" ry="2" />
      <path d="M3 11.5v1a8 8 0 0 0 16 0v-1" strokeLinecap="round" />
      <path d="M9 4c0 1-1 1-1 2s1 1 1 2M14 4c0 1-1 1-1 2s1 1 1 2" strokeLinecap="round" />
    </>
  ),
  meat: (
    <>
      <circle cx="13" cy="9" r="5" />
      <path d="M9 13l-4 4a2 2 0 1 0 2 2l4-4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  bakery: (
    <>
      <path d="M4 14c0-5 3.5-9 8-9s8 4 8 9v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z" strokeLinejoin="round" />
      <path d="M9 8l1 3M12 6.5v3.5M15 8l-1 3" strokeLinecap="round" />
    </>
  ),
  beverages: (
    <>
      <path d="M7 8h10l-1.2 11a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8L7 8z" strokeLinejoin="round" />
      <path d="M6 8h12" strokeLinecap="round" />
      <path d="M15 8l1.5-5" strokeLinecap="round" />
    </>
  ),
  frozen: (
    <>
      <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" strokeLinecap="round" />
      <path d="M12 6l-2 1.5M12 6l2 1.5M12 18l-2-1.5M12 18l2-1.5" strokeLinecap="round" />
    </>
  ),
};

export const CATEGORIES = [
  { label: "Produce", icon: "produce" },
  { label: "Dairy", icon: "dairy", excludeDiets: ["vegan"] },
  { label: "Snacks", icon: "snacks" },
  { label: "Noodles", icon: "noodles" },
  { label: "Meat", icon: "meat", excludeDiets: ["veg", "vegan", "eggetarian", "pescatarian"] },
  { label: "Bakery", icon: "bakery" },
  { label: "Beverages", icon: "beverages" },
  { label: "Frozen", icon: "frozen" },
];

export function categoriesForDiet(diet) {
  return CATEGORIES.filter((c) => !c.excludeDiets?.includes(diet));
}

export default function CategoryIcon({ name, size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
