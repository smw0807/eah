import { getSubCategories } from "@/apis/category";
import type { Category } from "@/models/category";
import { useQuery } from "@tanstack/react-query";

export function useSubCategory(parentId: number) {
  return useQuery<Category[]>({
    queryKey: ["subCategory", parentId],
    queryFn: () => getSubCategories(parentId),
  });
}
