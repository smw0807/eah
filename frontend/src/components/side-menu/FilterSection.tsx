import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { useState } from "react";
import { toastError } from "@/lib/toast";

interface FilterSectionProps {
  setFilterParams: (params: {
    sort: string;
    minPrice: number;
    maxPrice: number;
    search: string;
  }) => void;
}
export default function FilterSection({ setFilterParams }: FilterSectionProps) {
  const [sort, setSort] = useState<string>("createdAt");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [search, setSearch] = useState<string>("");

  const handleSearch = () => {
    if (minPrice > maxPrice) {
      toastError("최소 가격은 최대 가격보다 클 수 없습니다.");
      return;
    }
    setFilterParams({
      sort,
      minPrice,
      maxPrice,
      search,
    });
  };

  return (
    <div>
      <h2 className="text-foreground mb-3 text-lg font-semibold">필터</h2>
      <div className="space-y-4">
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">
            가격 범위
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="최소"
              className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="최대"
              className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">
            정렬
          </label>
          <Select onValueChange={(value) => setSort(value)}>
            <SelectTrigger className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">최신순</SelectItem>
              <SelectItem value="minPrice">가격 낮은순</SelectItem>
              <SelectItem value="maxPrice">가격 높은순</SelectItem>
              <SelectItem value="endAt">마감 임박순</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">
            검색
          </label>
          <Input
            type="text"
            placeholder="상품명 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Button
            type="submit"
            variant="default"
            size="full"
            className="hover:bg-muted-foreground p-2"
            onClick={handleSearch}
          >
            검색
          </Button>
        </div>
      </div>
    </div>
  );
}
