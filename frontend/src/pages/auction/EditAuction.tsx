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
import { useCreateAuction } from "@/hooks/mutations/auction/useCreateAuction";
import { useUpdateAuction } from "@/hooks/mutations/auction/useUpdateAction";
import { useImageUpload } from "@/hooks/mutations/image/useImageUpload";
import { useGetAuction } from "@/hooks/queries/auction/useGetAuction";
import { useSubCategory } from "@/hooks/queries/useSubCategory";
import { useTopCategory } from "@/hooks/queries/useTopCategory";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Image } from "@/models/auction";
import { useAlertModal } from "@/stores/alert-modal";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

export default function EditAuction() {
  const navigate = useNavigate();
  const openAlertModal = useAlertModal();
  const { id } = useParams();

  const isEditMode = !!(id && !isNaN(Number(id)));
  const auctionId = isEditMode ? Number(id) : 0;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startPrice, setStartPrice] = useState(0);
  const [minBidStep, setMinBidStep] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [subCategoryId, setSubCategoryId] = useState(0);
  const [startAt, setStartAt] = useState(new Date());
  const [endAt, setEndAt] = useState(new Date());
  const [buyoutPrice, setBuyoutPrice] = useState(0);
  const [image, setImage] = useState<Image | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const formInitializedRef = useRef(false);

  const { data: topCategories } = useTopCategory();
  const { data: subCategories } = useSubCategory(categoryId);
  const { data: auction, isLoading: isAuctionLoading } = useGetAuction(
    auctionId,
  );
  const { mutate: createAuction } = useCreateAuction({
    onSuccess: () => {
      toastSuccess("상품등록이 완료되었습니다.");
      navigate("/");
    },
    onError: (error) => {
      toastError(error.message);
    },
  });
  const { mutate: updateAuction } = useUpdateAuction({
    onSuccess: (response) => {
      if (response && response.statusCode === 400) {
        toastError(response.message as string);
        return;
      } else {
        toastSuccess("상품수정이 완료되었습니다.");
        navigate("/");
      }
    },
    onError: (error) => {
      toastError(error.message);
    },
  });
  const { mutateAsync: uploadImage } = useImageUpload({
    onError: (error) => {
      toastError(error.message);
    },
  });

  useEffect(() => {
    if (!isEditMode || !auction || formInitializedRef.current) return;
    formInitializedRef.current = true;
    setTitle(auction.title);
    setDescription(auction.description ?? "");
    setStartPrice(Number(auction.startPrice) || 0);
    setMinBidStep(Number(auction.minBidStep) || 0);
    setCategoryId(auction.categoryId);
    setSubCategoryId(auction.subCategoryId);
    setStartAt(new Date(auction.startAt));
    setEndAt(new Date(auction.endAt));
    setBuyoutPrice(Number(auction.buyoutPrice) || 0);
  }, [isEditMode, auction]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 50) {
      return;
    }
    setTitle(value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    if (value.length > 1000) {
      return;
    }
    setDescription(value);
  };

  const handleStartPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 10) {
      return;
    }
    setStartPrice(Number(value));
  };

  const handleBuyoutPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 10) {
      return;
    }
    setBuyoutPrice(Number(value));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files?.[0];

    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !startPrice ||
      !minBidStep ||
      !categoryId ||
      !subCategoryId ||
      !startAt ||
      !endAt ||
      !buyoutPrice
    ) {
      toastError("모든 필드를 입력해주세요.");
      return;
    }
    if (startPrice > buyoutPrice) {
      toastError("시작가격은 즉시 구매가보다 높을 수 없습니다.");
      return;
    }
    if (startAt >= endAt) {
      toastError("시작일시는 종료일시보다 이전일 수 없습니다.");
      return;
    }
    if (buyoutPrice < startPrice) {
      toastError("즉시 구매가는 시작가격보다 낮을 수 없습니다.");
      return;
    }

    const actionLabel = isEditMode ? "상품수정" : "상품등록";
    console.log(title,
      description,
      startPrice,
      minBidStep,
      buyoutPrice,
      startAt,
      endAt);
    openAlertModal.actions.open({
      title: actionLabel,
      description: `${actionLabel}을 진행하시겠습니까?`,
      onPositive: async () => {
        let imageUrl: string | null = null;
        if (image) {
          const upload = await uploadImage(image.file);
          imageUrl = upload.url;
        } else if (isEditMode && auction?.imageUrl) {
          imageUrl = auction.imageUrl;
        }
        if (isEditMode) {
          updateAuction({
            auctionId,
            updateAuctionInput: {
              title,
              description,
              startPrice,
              minBidStep,
              buyoutPrice,
              startAt,
              endAt,
              imageUrl,
            },
          });
        } else {
          createAuction({
            title,
            description,
            startPrice,
            minBidStep,
            buyoutPrice,
            categoryId,
            subCategoryId,
            startAt,
            endAt,
            imageUrl,
          });
        }
      },
    });
  };

  if (isEditMode && isAuctionLoading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">상품 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {isEditMode && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">
          {isEditMode ? "상품수정" : "상품등록"}
        </h1>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>상품명</Label>
          <Input type="text" value={title} onChange={handleTitleChange} />
          <p className="text-sm text-gray-500">
            상품명은 최대 50자까지 입력할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>상품설명</Label>
          <Textarea
            value={description}
            onChange={handleDescriptionChange}
            maxLength={1000}
          />
          <p className="text-sm text-gray-500">
            상품설명은 최대 1000자까지 입력할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>카테고리</Label>
          <div className="flex gap-2">
            <Select
              value={categoryId ? categoryId.toString() : ""}
              onValueChange={(value) => setCategoryId(Number(value))}
            >
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
            <Select
              value={subCategoryId ? subCategoryId.toString() : ""}
              onValueChange={(value) => setSubCategoryId(Number(value))}
            >
              <SelectTrigger className="w-50">
                <SelectValue placeholder="하위 카테고리를 선택해주세요." />
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
            onChange={handleStartPriceChange}
          />
          <p className="text-sm text-gray-500">
            시작가격은 최대 10자리까지 입력할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>입찰 단위</Label>
          <Select
            value={minBidStep ? minBidStep.toString() : ""}
            onValueChange={(value) => setMinBidStep(Number(value))}
          >
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
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex flex-col gap-2">
            <Label>시작일시</Label>
            <Input
              type="datetime-local"
              value={startAt.toISOString().slice(0, 16)}
              onChange={(e) => setStartAt(new Date(e.target.value))}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>종료일시</Label>
            <Input
              type="datetime-local"
              value={endAt.toISOString().slice(0, 16)}
              onChange={(e) => setEndAt(new Date(e.target.value))}
              min={startAt.toISOString().slice(0, 16)}
              max={new Date(
                new Date(startAt.toISOString().slice(0, 16)).setDate(
                  new Date(startAt.toISOString().slice(0, 16)).getDate() + 7,
                ),
              )
                .toISOString()
                .slice(0, 16)}
            />
          </div>
        </div>
        <p className="text-sm text-gray-500">
          경매 기간은 최대 7일까지 설정할 수 있습니다.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label>즉시 구매가</Label>
        <Input
          type="number"
          value={buyoutPrice}
          onChange={handleBuyoutPriceChange}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>상품 이미지</Label>
        {image ? (
          <img
            src={image.previewUrl}
            alt="이미지"
            className="h-100 w-100 object-cover"
          />
        ) : (
          isEditMode &&
          auction?.imageUrl && (
            <img
              src={auction.imageUrl}
              alt="현재 상품 이미지"
              className="h-100 w-100 object-cover"
            />
          )
        )}
        <Input
          type="file"
          ref={imageInputRef}
          onChange={handleImageChange}
          accept="image/*"
        />
      </div>
      <Button onClick={handleSubmit}>
        {isEditMode ? "상품수정" : "상품등록"}
      </Button>
    </div>
  );
}
