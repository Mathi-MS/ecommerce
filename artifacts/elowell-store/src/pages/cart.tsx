import { AppLayout } from "@/components/layout/AppLayout";
import { useGetCart, useUpdateCartItem, useRemoveCartItem, useValidateReferralCode } from "@workspace/api-client-react";
import { useSessionStore } from "@/store/session";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const cartSessionId = useSessionStore(s => s.cartSessionId);
  const { data: cart, isLoading } = useGetCart({ sessionId: cartSessionId });
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const validateReferral = useValidateReferralCode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const handleUpdate = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateMutation.mutate({
      itemId,
      data: { quantity: newQuantity, sessionId: cartSessionId }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] })
    });
  };

  const handleRemove = (itemId: number) => {
    removeMutation.mutate({
      itemId,
      data: { sessionId: cartSessionId }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] })
    });
  };

  const applyPromo = () => {
    if (!promoCode) return;
    validateReferral.mutate({ data: { code: promoCode } }, {
      onSuccess: (res) => {
        setDiscountPercent(res.discountPercent);
        toast({ title: "Code Applied", description: `You got ${res.discountPercent}% off!` });
      },
      onError: () => {
        setDiscountPercent(0);
        toast({ title: "Invalid Code", description: "This code is not valid.", variant: "destructive" });
      }
    });
  };

  const isCartEmpty = !cart || cart.items.length === 0;
  const subtotal = cart?.total || 0;
  const discountAmount = subtotal * (discountPercent / 100);
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
            <Link href="/products">
              <Button size="lg" className="rounded-xl px-8">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <ul className="divide-y divide-border">
                  {cart.items.map(item => (
                    <li key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                      <img src={item.productImage || 'https://via.placeholder.com/150'} alt={item.productName} className="w-24 h-24 rounded-xl object-cover bg-muted/50 border border-border/50 shrink-0" />
                      <div className="flex-1 text-center sm:text-left">
                        <Link href={`/products/${item.productId}`} className="font-bold text-lg hover:text-primary transition-colors block mb-1">
                          {item.productName}
                        </Link>
                        <div className="text-muted-foreground mb-4">
                          ${(item.discountPrice || item.price).toFixed(2)} each
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
                        ${((item.discountPrice || item.price) * item.quantity).toFixed(2)}
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
                    <div className="flex justify-between text-secondary font-medium">
                      <span>Discount ({discountPercent}%)</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
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

                <div className="mb-6 flex gap-2">
                  <Input 
                    placeholder="Referral Code" 
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

                <Link href="/checkout">
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
