export type SearchAuctionsQuery = {
  sort?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  page?: number;
  limit?: number;
};
