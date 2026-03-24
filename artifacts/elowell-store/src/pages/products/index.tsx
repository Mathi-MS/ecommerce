import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProductCard } from "@/components/ProductCard";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const [category, setCategory] = useState<string>('');
  
  const { data: productsData, isLoading } = useListProducts({ category: category || undefined });
  const { data: categories } = useListCategories();

  return (
    <AppLayout>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4">Shop All Essentials</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Explore our full range of natural, earth-derived wellness products designed to nourish your body and soul.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-28 bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-lg mb-6 border-b border-border pb-4">
              <Filter className="h-5 w-5" /> Filters
            </div>
            
            <div className="mb-8">
              <h3 className="font-medium text-foreground mb-4">Categories</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={category === ''}
                    onChange={() => setCategory('')}
                    className="w-4 h-4 text-primary focus:ring-primary border-border"
                  />
                  <span className={`text-sm group-hover:text-primary transition-colors ${category === '' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>All Products</span>
                </label>
                {categories?.map(cat => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={category === cat.slug}
                      onChange={() => setCategory(cat.slug)}
                      className="w-4 h-4 text-primary focus:ring-primary border-border"
                    />
                    <span className={`text-sm group-hover:text-primary transition-colors ${category === cat.slug ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Product Grid */}
        <main className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : productsData?.products?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsData.products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-2xl border border-border/50 border-dashed">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">We couldn't find any products matching your selection.</p>
              <Button onClick={() => setCategory('')} variant="outline" className="rounded-xl">Clear Filters</Button>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
