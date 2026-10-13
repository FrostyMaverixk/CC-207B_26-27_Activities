"use client";

import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CarouselApi = UseEmblaCarouselType[1];
type CarouselProps = {
  opts?: Parameters<typeof useEmblaCarousel>[0];
  setApi?: (api: CarouselApi) => void;
};

const CarouselContext = React.createContext<{
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  orientation: "horizontal" | "vertical";
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a Carousel");
  return context;
}

const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CarouselProps>(
  ({ opts, setApi, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel({ align: "start", ...opts });
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const update = React.useCallback((nextApi: CarouselApi) => {
      if (!nextApi) return;
      setCanScrollPrev(nextApi.canScrollPrev());
      setCanScrollNext(nextApi.canScrollNext());
    }, []);

    React.useEffect(() => {
      if (!api) return;
      setApi?.(api);
      update(api);
      api.on("select", update);
      api.on("reInit", update);
      return () => {
        api.off("select", update);
        api.off("reInit", update);
      };
    }, [api, setApi, update]);

    return (
      <CarouselContext.Provider value={{ carouselRef, orientation: "horizontal", scrollPrev: () => api?.scrollPrev(), scrollNext: () => api?.scrollNext(), canScrollPrev, canScrollNext }}>
        <div ref={ref} className={cn("relative", className)} role="region" aria-roledescription="carousel" {...props}>
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const { carouselRef } = useCarousel();
  return <div ref={carouselRef} className="overflow-hidden"><div ref={ref} className={cn("flex", className)} {...props} /></div>;
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} role="group" aria-roledescription="slide" className={cn("min-w-0 shrink-0 grow-0 basis-auto", className)} {...props} />
));
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(({ className, children, ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return <Button ref={ref} variant="outline" size="icon" className={cn("rounded-full", className)} disabled={!canScrollPrev} onClick={scrollPrev} {...props}>{children ?? <ArrowLeft className="h-4 w-4" />}</Button>;
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(({ className, children, ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();
  return <Button ref={ref} variant="outline" size="icon" className={cn("rounded-full", className)} disabled={!canScrollNext} onClick={scrollNext} {...props}>{children ?? <ArrowRight className="h-4 w-4" />}</Button>;
});
CarouselNext.displayName = "CarouselNext";

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi };
