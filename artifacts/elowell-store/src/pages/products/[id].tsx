import { useState } from "react";
import { useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetProduct, useAddToCart, useGetProductReviews } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, Star, Tag } from "lucide-react";
import { useSessionStore } from "@/store/session";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ProductCard";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { data: product, isLoading } = useGetProduct(id as any);
  const { data: reviews } = useGetProductReviews(id as any);
  const cartSessionId = useSessionStore(s => s.cartSessionId);
  const addToCartMutation = useAddToCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) {
    return <AppLayout><div className="min-h-[60vh] flex items-center justify-center">Loading product...</div></AppLayout>;
  }

  if (!product) {
    return <AppLayout><div className="min-h-[60vh] flex items-center justify-center">Product not found.</div></AppLayout>;
  }

  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1611078449911-3771bd9a691b?w=800&q=80'];

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    
    addToCartMutation.mutate({
      data: {
        productId: product.id,
        quantity,
        sessionId: cartSessionId
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({
          title: "Added to Cart",
          description: `${quantity}x ${product.name} added to your cart.`
        });
      },
      onError: (error: any) => {
        console.log(error,"wedwed");
        let errorMessage = error.message || "Failed to add to cart";
        // Remove "HTTP 400 Bad Request: " prefix if present
        if (errorMessage.includes("HTTP 400 Bad Request: ")) {
          errorMessage = errorMessage.replace("HTTP 400 Bad Request: ", "");
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Product Top Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mb-24">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted/30 border border-border/50">
              <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover object-center" />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-sm font-bold text-primary uppercase tracking-wider">{product.categoryName || 'Natural'}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex text-secondary">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-5 w-5 ${star <= (product.averageRating || 5) ? 'fill-current' : 'fill-transparent text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-muted-foreground underline cursor-pointer">{product.reviewCount || 0} reviews</span>
            </div>

            <div className="mb-8">
              {product.discountPrice ? (
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-primary">${product.discountPrice.toFixed(2)}</span>
                  <span className="text-xl text-muted-foreground line-through mb-1">${product.price.toFixed(2)}</span>
                  <span className="text-sm font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-md mb-1 ml-2">{Math.round((product.price - product.discountPrice) / product.price * 100)}% OFF</span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-foreground">${product.price.toFixed(2)}</span>
              )}
            </div>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.shortDescription}
            </p>

            {product.referralCode && (
              <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-8 flex items-center gap-3 text-secondary-foreground">
                <Tag className="h-5 w-5 text-secondary" />
                <span className="font-medium">Use code <strong className="font-bold">{product.referralCode}</strong> at checkout for a special discount!</span>
              </div>
            )}

            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
              <div className="flex items-center bg-card border border-border rounded-xl h-14 p-1 shadow-sm">
                <button 
                  className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <button 
                  className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button 
                size="lg" 
                className="flex-1 h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 gap-3"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending || product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock === 0 ? "Out of Stock" : addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Availability:</strong> {product.stock > 0 ? (product.stock <= 5 ? <span className="text-orange-600">{product.stock} left (Low Stock)</span> : <span className="text-primary">{product.stock} in stock</span>) : <span className="text-destructive">Out of stock</span>}</p>
              <p><strong className="text-foreground">SKU:</strong> ELO-{product.id.toString().padStart(4, '0')}</p>
            </div>
          </div>
        </div>

        {/* Description & Reviews */}
        <div className="grid lg:grid-cols-3 gap-16 mb-24">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold font-display mb-6">Product Details</h2>
            <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none text-muted-foreground">
              {product.description.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display mb-6">Reviews</h2>
            {reviews?.length ? (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex text-secondary">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : 'fill-transparent text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <span className="font-bold text-sm ml-2">{review.reviewerName}</span>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold font-display mb-8 text-center">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {product.relatedProducts.slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
