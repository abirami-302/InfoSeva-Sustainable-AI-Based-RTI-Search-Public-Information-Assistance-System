import { useState, useMemo, useEffect } from 'react';

/**
 * usePagination — slices `items` into pages.
 * Resets to page 1 whenever the input list identity/length changes
 * (e.g. after a new search or filter is applied).
 */
export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return { page: safePage, setPage, totalPages, pageItems, pageSize };
}
