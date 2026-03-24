import { Link } from "wouter";
import { Star, ShoppingCart } from "lucide-react";
import { Product, useAddToCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export function ProductCard({ product }: { product: Product }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cartSessionId = useSessionStore(s => s.cartSessionId);
  const addToCartMutation = useAddToCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent link navigation
    addToCartMutation.mutate({
      data: {
        productId: product.id,
        quantity: 1,
        sessionId: cartSessionId
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({
          title: "Added to Cart",
          description: `${product.name} has been added to your cart.`
        });
      }
    });
  };

  const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1611078449911-3771bd9a691b?w=800&q=80';

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <motion.div 
        whileHover={{ y: -4 }}
        className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:border-border transition-all duration-300 h-full flex flex-col"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-muted/30">
          <img 
            src={imageSrc} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {product.discountPrice && (
            <div className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              Sale
            </div>
          )}
          
          <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button 
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
              className="w-full shadow-lg gap-2 rounded-xl"
            >
              <ShoppingCart className="h-4 w-4" />
              {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-bold text-foreground line-clamp-2 leading-tight flex-1 group-hover:text-primary transition-colors">{product.name}</h3>
            <div className="text-right shrink-0">
              {product.discountPrice ? (
                <>
                  <div className="font-bold text-lg text-primary">${product.discountPrice.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</div>
                </>
              ) : (
                <div className="font-bold text-lg text-foreground">${product.price.toFixed(2)}</div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{product.shortDescription}</p>
          
          <div className="flex items-center gap-1 mt-auto">
            <div className="flex text-secondary">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 ${star <= (product.averageRating || 5) ? 'fill-current' : 'fill-transparent text-muted-foreground/30'}`} 
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1">({product.reviewCount || 0})</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
