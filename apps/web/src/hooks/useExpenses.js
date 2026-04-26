import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchExpenses } from "../lib/api";

export function useExpenses({ category, sort }) {
  const query = useQuery({
    queryKey: ["expenses", { category, sort }],
    queryFn: () => fetchExpenses({ category, sort }),
  });

  const items = useMemo(() => {
    const data = query.data;
    if (!data) return [];
    return Array.isArray(data) ? data : data.items ?? data.data ?? [];
  }, [query.data]);

  const total = useMemo(
    () => items.reduce((sum, row) => sum + Number(row.amount), 0),
    [items],
  );

  return { ...query, items, total };
}
