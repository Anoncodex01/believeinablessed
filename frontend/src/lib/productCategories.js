export const productCategories = [
  'Trousers',
  'T-Shirts',
  'Full trucks',
  'Vests',
  'Shorts',
  'Socks',
  'Hoodie',
];

export function productCategoryHref(label) {
  return `/products?search=${encodeURIComponent(label)}`;
}
