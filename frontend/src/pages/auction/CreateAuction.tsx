import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSubCategory } from "@/hooks/queries/useSubCategory";
import { useTopCategory } from "@/hooks/queries/useTopCategory";
import { useRef, useState } from "react";

type Image = { file: File; previewUrl: string };

export default function CreateAuction() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startPrice, setStartPrice] = useState(0);
  const [minBidStep, setMinBidStep] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [subCategoryId, setSubCategoryId] = useState(0);
  const [startAt, setStartAt] = useState(new Date());
  const [endAt, setEndAt] = useState(new Date());
  const [imageUrl, setImageUrl] = useState<Image | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: topCategories } = useTopCategory();
  const { data: subCategories } = useSubCategory(categoryId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files?.[0];

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl.previewUrl);
    }
    setImageUrl({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleSubmit = () => {
    console.log("submit");
    console.log(title);
    console.log(description);
    console.log(startPrice);
    console.log(minBidStep);
    console.log(categoryId);
    console.log(subCategoryId);
    console.log(startAt);
    console.log(endAt);
    console.log(imageUrl);
  };
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">상품등록</h1>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>상품명</Label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>상품설명</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>카테고리</Label>
          <div className="flex gap-2">
            <Select onValueChange={(value) => setCategoryId(Number(value))}>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="카테고리를 선택해주세요." />
              </SelectTrigger>
              <SelectContent>
                {topCategories
                  ?.filter((category) => category.code !== "ALL")
                  .map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setSubCategoryId(Number(value))}>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="카테고리를 선택해주세요." />
              </SelectTrigger>
              <SelectContent>
                {subCategories?.map((subCategory) => (
                  <SelectItem
                    key={subCategory.id}
                    value={subCategory.id.toString()}
                  >
                    {subCategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>시작가격</Label>
          <Input
            type="number"
            value={startPrice}
            onChange={(e) => setStartPrice(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>입찰 단위</Label>
          <Select onValueChange={(value) => setMinBidStep(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="입찰 단위를 선택해주세요." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100원</SelectItem>
              <SelectItem value="1000">1,000원</SelectItem>
              <SelectItem value="10000">10,000원</SelectItem>
              <SelectItem value="100000">100,000원</SelectItem>
              <SelectItem value="1000000">1,000,000원</SelectItem>
              <SelectItem value="10000000">10,000,000원</SelectItem>
              <SelectItem value="100000000">100,000,000원</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-2">
          <Label>시작일시</Label>
          <Input
            type="datetime-local"
            value={startAt.toISOString().slice(0, 16)}
            onChange={(e) => setStartAt(new Date(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>종료일시</Label>
          <Input
            type="datetime-local"
            value={endAt.toISOString().slice(0, 16)}
            onChange={(e) => setEndAt(new Date(e.target.value))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>상품 이미지</Label>
        {imageUrl && (
          <img
            src={imageUrl.previewUrl}
            alt="이미지"
            className="h-100 w-100 object-cover"
          />
        )}
        <Input
          type="file"
          ref={imageInputRef}
          onChange={handleImageChange}
          accept="image/*"
        />
      </div>
      <Button onClick={handleSubmit}>상품등록</Button>
    </div>
  );
}
