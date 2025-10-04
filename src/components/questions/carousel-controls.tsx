"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselControlsProps {
  currentIndex: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
  label: string;
}

const CarouselControls = ({
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  label
}: CarouselControlsProps) => {
  if (totalItems <= 1) return null;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <span className="text-sm text-muted-foreground px-2">
          {currentIndex + 1} of {totalItems} {label}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentIndex === totalItems - 1}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CarouselControls;