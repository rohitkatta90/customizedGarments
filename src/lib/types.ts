export type CatalogCategory =
  | "blouses"
  | "kurtis"
  | "dresses"
  | "custom-designs";

export type CatalogItem = {
  id: string;
  category: CatalogCategory;
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export type Review = {
  id: string;
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  featured?: boolean;
};

export type AlterationType =
  | "resize"
  | "length"
  | "zipper"
  | "embroidery"
  | "other";
