import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGetCart } from "@/lib/api";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingCart() {
  const { data: cart, isLoading } = useGetCart();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading || !cart || cart.itemCount === 0) {
    return null;
  }

  // Get first few product images to display
  const displayImages = cart.items.slice(0, 2).map(item => item.productImage);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-2 bg-card border border-border rounded-2xl shadow-lg p-4 max-w-sm w-80"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Cart Items</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-8 h-8 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.productName}</p>
                    <p className="text-muted-foreground">₹{item.price} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-2 border-t border-border">
              <Link href="/checkout">
                <Button className="w-full rounded-xl" size="sm">
                  Checkout
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer overflow-hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 pl-2 pr-4 py-2">
          {/* Product Images */}
          <div className="flex items-center -space-x-2">
            {displayImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt="Product"
                  className="w-8 h-8 rounded-full border-2 border-primary object-cover bg-white"
                />
              </div>
            ))}
            {cart.itemCount > 2 && (
              <div className="w-8 h-8 rounded-full border-2 border-primary bg-primary-foreground text-primary text-xs font-bold flex items-center justify-center">
                +{cart.itemCount - 2}
              </div>
            )}
          </div>
          
          {/* Item count and total */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">
              {cart.itemCount} item{cart.itemCount > 1 ? 's' : ''}
            </span>
            <div className="text-sm font-bold">
              ₹{cart.total.toLocaleString()}
            </div>
          </div>
          
          {/* Cart icon with badge */}
          <div className="relative ml-1">
            <ShoppingCart className="h-4 w-4" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}