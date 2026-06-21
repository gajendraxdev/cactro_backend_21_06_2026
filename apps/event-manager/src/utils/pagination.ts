import type { PaginationMeta } from "@event-booking/types";

export interface PaginationQuery {
  page: number;
  limit: number;
}

export function parsePaginationQuery(
  page?: string,
  limit?: string,
): PaginationQuery {
  const parsedPage = Number(page ?? 1);
  const parsedLimit = Number(limit ?? 10);

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    limit:
      Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100
        ? parsedLimit
        : 10,
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}