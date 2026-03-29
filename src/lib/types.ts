export type CatalogCategory =
  | "blouses"
  | "kurtis"
  | "dresses"
  | "custom-designs";

/** Who the piece is for — drives gallery grouping. Defaults to women when omitted in JSON. */
export type CatalogAudience = "women" | "girls";

export type CatalogItem = {
  id: string;
  category: CatalogCategory;
  /** Omit or any other value → treated as women's line */
  audience?: CatalogAudience;
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
