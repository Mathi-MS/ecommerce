import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight } from "lucide-react";
import { useListProducts } from "@/lib/api";

interface HomeSectionProps {
  section: {
    id: string;
    type: 'about' | 'featured-products' | 'categories' | 'testimonials';
    title: string;
    subtitle?: string;
    config: any;
  };
  index: number;
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AboutSection({ section, index }: HomeSectionProps) {
  const { config } = section;
  
  return (
    <section className={`py-24 ${index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
          <div className={`relative ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
            <div className="absolute inset-0 bg-secondary/20 rounded-[2rem] transform translate-x-4 translate-y-4"></div>
            <img 
              src={config.imageUrl} 
              alt={section.title} 
              className="relative z-10 w-full h-auto rounded-[2rem] shadow-xl object-cover aspect-[4/3]"
            />
          </div>
          <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
            <h2 className="text-4xl font-bold font-display mb-6 leading-tight">{section.title}</h2>
            {section.subtitle && (
              <p className="text-xl text-muted-foreground mb-4">{section.subtitle}</p>
            )}
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {config.description}
            </p>
            {config.features && config.features.length > 0 && (
              <ul className="space-y-4 mb-8">
                {config.features.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                    <CheckCircleIcon className="text-primary h-5 w-5" /> {item}
                  </li>
                ))}
              </ul>
            )}
            {config.buttonText && config.buttonLink && (
              <Link to={config.buttonLink}>
                <Button size="lg" className="rounded-xl px-8">{config.buttonText}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedProductsSection({ section }: HomeSectionProps) {
  const { config } = section;
  
  // If specific products are selected, fetch them by IDs
  const shouldFetchSelected = config.selectedProductIds && config.selectedProductIds.length > 0;
  
  const { data: productsData, isLoading } = useListProducts({ 
    featured: shouldFetchSelected ? undefined : (config.showFeatured !== false), 
    limit: shouldFetchSelected ? undefined : (config.productLimit || 4),
    category: shouldFetchSelected ? undefined : config.category,
    ids: shouldFetchSelected ? config.selectedProductIds : undefined
  });

  // Filter and limit products if using selected IDs
  const displayProducts = shouldFetchSelected 
    ? productsData?.products?.slice(0, config.productLimit || 4) || []
    : productsData?.products || [];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold font-display text-foreground mb-4">{section.title}</h2>
            {section.subtitle && (
              <p className="text-muted-foreground text-lg">{section.subtitle}</p>
            )}
          </div>
          {config.viewAllText && config.viewAllLink && (
            <Link to={config.viewAllLink} className="hidden sm:flex items-center gap-2 font-medium text-primary hover:text-primary/80 transition-colors">
              {config.viewAllText} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: config.productLimit || 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-muted/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        {config.viewAllText && config.viewAllLink && (
          <div className="mt-8 text-center sm:hidden">
            <Link to={config.viewAllLink}>
              <Button variant="outline" className="w-full rounded-xl h-12">{config.viewAllText}</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function CategoriesSection({ section }: HomeSectionProps) {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-display mb-4">{section.title}</h2>
          {section.subtitle && (
            <p className="text-muted-foreground text-lg">{section.subtitle}</p>
          )}
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Categories section coming soon...</p>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ section }: HomeSectionProps) {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-display mb-4">{section.title}</h2>
          {section.subtitle && (
            <p className="text-muted-foreground text-lg">{section.subtitle}</p>
          )}
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Testimonials section coming soon...</p>
        </div>
      </div>
    </section>
  );
}

export function DynamicHomeSection({ section, index }: HomeSectionProps) {
  switch (section.type) {
    case 'about':
      return <AboutSection section={section} index={index} />;
    case 'featured-products':
      return <FeaturedProductsSection section={section} index={index} />;
    case 'categories':
      return <CategoriesSection section={section} index={index} />;
    case 'testimonials':
      return <TestimonialsSection section={section} index={index} />;
    default:
      return null;
  }
}