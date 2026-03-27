import { useState, useEffect } from "react";
import { useListBanners } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export function BannerCarousel() {
  const { data: banners, isLoading } = useListBanners({ active: true });
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [banners]);

  const nextSlide = () => {
    if (!banners) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    if (!banners) return;
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="relative h-[70vh] md:h-[80vh] bg-muted/30 animate-pulse" />
    );
  }

  if (!banners || banners.length === 0) {
    return null; // Don't show carousel if no banners
  }

  const activeBanners = banners.filter(banner => banner.isActive);
  if (activeBanners.length === 0) return null;

  return (
    <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Banner Slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {activeBanners.map((banner, index) => (
          <div
            key={banner.id}
            className="min-w-full h-full relative flex items-center"
            style={{
              backgroundImage: `url(${banner.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl">
                {banner.subtitle && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4 backdrop-blur-sm border border-primary/30">
                    {banner.subtitle}
                  </div>
                )}
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-white mb-6 leading-tight">
                  {banner.title}
                </h1>
                
                <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                  {banner.description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {banner.button1Text && banner.button1Link && (
                    <Link href={banner.button1Link}>
                      <Button 
                        size="lg" 
                        className="rounded-full px-8 py-3 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        {banner.button1Text}
                      </Button>
                    </Link>
                  )}
                  
                  {banner.button2Text && banner.button2Link && (
                    <Link href={banner.button2Link}>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="rounded-full px-8 py-3 text-base font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        {banner.button2Text}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-all duration-300 group"
          >
            <ChevronLeft className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-all duration-300 group"
          >
            <ChevronRight className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}