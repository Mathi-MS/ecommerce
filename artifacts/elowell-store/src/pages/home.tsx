import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Link } from "wouter";
import { ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react";
import { useListProducts, useListCategories, useListHomeSections } from "@/lib/api";
import { DynamicHomeSection } from "@/components/DynamicHomeSection";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";

export default function Home() {
  const { data: categoriesData } = useListCategories();
  const { data: homeSections, isLoading: sectionsLoading } = useListHomeSections();

  return (
    <AppLayout>
      {/* Full Screen Banner Carousel */}
      <BannerCarousel />

      {/* Features Banner */}
      <section className="bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex flex-col items-center py-4 md:py-0">
              <Leaf className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">100% Natural</h3>
              <p className="text-muted-foreground text-sm">No synthetics, just pure botanical goodness.</p>
            </div>
            <div className="flex flex-col items-center py-4 md:py-0">
              <ShieldCheck className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Ethically Sourced</h3>
              <p className="text-muted-foreground text-sm">Sustainably harvested from trusted farmers.</p>
            </div>
            <div className="flex flex-col items-center py-4 md:py-0">
              <Truck className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground text-sm">Free shipping on all orders over $50.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Home Sections */}
      {sectionsLoading ? (
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <div className="h-12 bg-muted/50 rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[4/5] bg-muted/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : homeSections && homeSections.length > 0 ? (
        homeSections.map((section, index) => (
          <DynamicHomeSection key={section.id} section={section} index={index} />
        ))
      ) : (
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No sections configured</h2>
            <p className="text-muted-foreground">Please configure your home sections in the admin panel.</p>
          </div>
        </section>
      )}
    </AppLayout>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
