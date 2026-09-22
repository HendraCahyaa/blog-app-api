export interface paginationQueryParams {
  page: number;
  take: number;
  sortOrder: string; //asc or desc
  sortBy: string; //based on column
  search: string;
}
