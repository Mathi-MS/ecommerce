import { AppLayout } from "@/components/layout/AppLayout";
import { useGetCart, useUpdateCartItem, useRemoveCartItem, useValidateReferralCode } from "@/lib/api";
import { useSessionStore } from "@/store/session";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, cartSessionId } = useSessionStore();
  const { data: cart, isLoading, refetch } = useGetCart({ sessionId: cartSessionId });
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const validateReferral = useValidateReferralCode();
  const { toast } = useToast();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [localCart, setLocalCart] = useState<any>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, number>>(new Map());
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

  // Use local cart if available, otherwise use server cart data
  const displayCart = localCart || cart;

  // Initialize local cart when server data loads
  useEffect(() => {
    if (cart && !localCart) {
      setLocalCart(cart);
    }
  }, [cart, localCart]);

  // Load applied referral code from session storage
  useEffect(() => {
    const savedReferralCode = sessionStorage.getItem('appliedReferralCode');
    const savedDiscountPercent = sessionStorage.getItem('appliedDiscountPercent');
    if (savedReferralCode && savedDiscountPercent) {
      setPromoCode(savedReferralCode);
      setDiscountPercent(Number(savedDiscountPercent));
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to view your cart.",
        variant: "destructive"
      });
      navigate('/auth?redirect=' + encodeURIComponent('/cart'));
    }
  }, [user, navigate, toast]);

  // Sync with server only on page unload or navigation
  const syncWithServer = async () => {
    if (pendingUpdates.size === 0 && pendingDeletes.size === 0) return;
    
    try {
      // Process pending updates
      const updatePromises = Array.from(pendingUpdates.entries()).map(([itemId, quantity]) =>
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
          },
          body: JSON.stringify({ quantity, sessionId: cartSessionId })
        })
      );
      
      // Process pending deletes
      const deletePromises = Array.from(pendingDeletes).map(itemId =>
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
          },
          body: JSON.stringify({ sessionId: cartSessionId })
        })
      );
      
      // Execute all requests
      await Promise.all([...updatePromises, ...deletePromises]);
      
      // Clear pending operations
      setPendingUpdates(new Map());
      setPendingDeletes(new Set());
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  };

  // Sync on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingUpdates.size > 0 || pendingDeletes.size > 0) {
        // Use sendBeacon for reliable sync on page unload
        const updates = Array.from(pendingUpdates.entries()).map(([itemId, quantity]) => ({
          type: 'update',
          itemId,
          quantity,
          sessionId: cartSessionId
        }));
        
        const deletes = Array.from(pendingDeletes).map(itemId => ({
          type: 'delete',
          itemId,
          sessionId: cartSessionId
        }));
        
        const payload = JSON.stringify([...updates, ...deletes]);
        navigator.sendBeacon('/api/cart/batch', payload);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncWithServer();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Sync any pending changes on component unmount (navigation)
      if (pendingUpdates.size > 0 || pendingDeletes.size > 0) {
        syncWithServer();
      }
    };
  }, [pendingUpdates, pendingDeletes, cartSessionId]);

  const handleUpdate = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Update local cart immediately
    if (localCart) {
      const updatedItems = localCart.items.map((item: any) => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      const updatedTotal = updatedItems.reduce((sum: number, item: any) => 
        sum + (item.discountPrice || item.price || 0) * item.quantity, 0
      );
      const updatedItemCount = updatedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      setLocalCart({
        ...localCart,
        items: updatedItems,
        total: updatedTotal,
        itemCount: updatedItemCount
      });
      
      // Track pending update (no API call)
      setPendingUpdates(prev => new Map(prev.set(itemId, newQuantity)));
    }
  };

  const handleRemove = (itemId: string) => {
    // Update local cart immediately
    if (localCart) {
      const updatedItems = localCart.items.filter((item: any) => item.id !== itemId);
      const updatedTotal = updatedItems.reduce((sum: number, item: any) => 
        sum + (item.discountPrice || item.price || 0) * item.quantity, 0
      );
      const updatedItemCount = updatedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      setLocalCart({
        ...localCart,
        items: updatedItems,
        total: updatedTotal,
        itemCount: updatedItemCount
      });
      
      // Track pending delete (no API call)
      setPendingDeletes(prev => new Set(prev.add(itemId)));
      // Remove from pending updates if it exists
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    }
  };


  const applyPromo = () => {
    if (!promoCode || !displayCart?.items) return;
    
    validateReferral.mutate({ 
      data: { 
        code: promoCode,
        cartItems: displayCart.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discountPrice: item.discountPrice
        }))
      } 
    }, {
      onSuccess: (res: any) => {
        setDiscountPercent(res.discountPercent);
        // Store in session storage for checkout
        sessionStorage.setItem('appliedReferralCode', promoCode);
        sessionStorage.setItem('appliedDiscountPercent', String(res.discountPercent));
        sessionStorage.setItem('applicableAmount', String(res.applicableAmount || 0));
        sessionStorage.setItem('applicableItems', JSON.stringify(res.applicableItems || []));
        
        const discountAmount = (res.applicableAmount || 0) * (res.discountPercent / 100);
        toast({ 
          title: "Code Applied", 
          description: `You got ${res.discountPercent}% off on eligible items! Saved $${discountAmount.toFixed(2)}` 
        });
      },
      onError: (error: any) => {
        setDiscountPercent(0);
        // Clear session storage
        sessionStorage.removeItem('appliedReferralCode');
        sessionStorage.removeItem('appliedDiscountPercent');
        sessionStorage.removeItem('applicableAmount');
        sessionStorage.removeItem('applicableItems');
        toast({ 
          title: "Invalid Code", 
          description: error.message || "This code is not valid.", 
          variant: "destructive" 
        });
      }
    });
  };

  const isCartEmpty = !displayCart || displayCart.items.length === 0;
  const subtotal = displayCart?.total || 0;
  
  // Calculate discount only for applicable items
  const applicableAmount = sessionStorage.getItem('applicableAmount') ? 
    Number(sessionStorage.getItem('applicableAmount')) : subtotal;
  const discountAmount = applicableAmount * (discountPercent / 100);
  const finalTotal = subtotal - discountAmount;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <h1 className="text-4xl font-bold font-display mb-10">Your Cart</h1>
        
        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">Loading cart...</div>
        ) : isCartEmpty ? (
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted text-muted-foreground mb-6">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added any natural goodness to your cart yet.</p>
            <Link to="/products">
              <Button size="lg" className="rounded-xl px-8">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <ul className="divide-y divide-border">
                  {displayCart.items.map((item: any) => (
                    <li key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                      <img src={item.productImage || 'https://via.placeholder.com/150'} alt={item.productName || 'Product'} className="w-24 h-24 rounded-xl object-cover bg-muted/50 border border-border/50 shrink-0" />
                      <div className="flex-1 text-center sm:text-left">
                        <Link to={`/products/${item.productId}`} className="font-bold text-lg hover:text-primary transition-colors block mb-1">
                          {item.productName || 'Product'}
                        </Link>
                        <div className="text-muted-foreground mb-4">
                          ${(item.discountPrice || item.price || 0).toFixed(2)} each
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-4">
                          <div className="flex items-center bg-muted/50 border border-border rounded-lg h-10 p-1">
                            <button onClick={() => handleUpdate(item.id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center hover:bg-background rounded transition-colors"><Minus className="h-3 w-3"/></button>
                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                            <button onClick={() => handleUpdate(item.id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center hover:bg-background rounded transition-colors"><Plus className="h-3 w-3"/></button>
                          </div>
                          <button onClick={() => handleRemove(item.id)} className="text-muted-foreground hover:text-destructive p-2 rounded-full hover:bg-destructive/10 transition-colors">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="font-bold text-xl text-foreground">
                        ${((item.discountPrice || item.price || 0) * item.quantity).toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 sticky top-28">
                <h2 className="text-xl font-bold font-display mb-6 border-b border-border pb-4">Order Summary</h2>
                
                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <>
                      <div className="bg-secondary/10 p-3 rounded-lg border border-secondary/20">
                        <div className="flex justify-between text-secondary font-medium mb-2">
                          <span>Discount ({discountPercent}%) - {promoCode}</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium mb-1">Applied to:</div>
                          {(() => {
                            const applicableItems = JSON.parse(sessionStorage.getItem('applicableItems') || '[]');
                            const applicableProducts = displayCart?.items?.filter((item: any) => 
                              applicableItems.includes(item.productId)
                            ) || [];
                            
                            return applicableProducts.map((item: any, index: number) => (
                              <div key={item.id} className="flex justify-between">
                                <span>• {item.productName}</span>
                                <span>${((item.discountPrice || item.price) * item.quantity).toFixed(2)}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{finalTotal >= 50 ? 'Free' : '$5.00'}</span>
                  </div>
                </div>

                <div className="border-t border-border py-4 mb-6">
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span>${(finalTotal + (finalTotal >= 50 ? 0 : 5)).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  <Label htmlFor="referralCode">Referral Code</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="referralCode"
                      placeholder="Enter referral code" 
                      value={promoCode} 
                      onChange={e => setPromoCode(e.target.value)} 
                      className="rounded-xl h-12"
                    />
                    <Button 
                      variant="secondary" 
                      className="rounded-xl h-12" 
                      onClick={applyPromo}
                      disabled={validateReferral.isPending || !promoCode}
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                <Link to="/checkout">
                  <Button size="lg" className="w-full h-14 rounded-xl shadow-lg shadow-primary/25 gap-2 text-lg">
                    Checkout <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="text-center mt-4 text-xs text-muted-foreground">
                  Secure checkout powered by Razorpay
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}