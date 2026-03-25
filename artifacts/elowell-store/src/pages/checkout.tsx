import { AppLayout } from "@/components/layout/AppLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSessionStore } from "@/store/session";
import { useGetCart, useCreateOrder } from "@/lib/api";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().min(10, "Valid phone required"),
  address: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().min(5, "Valid pincode required"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const cartSessionId = useSessionStore(s => s.cartSessionId);
  const user = useSessionStore(s => s.user);
  const { data: cart, isLoading } = useGetCart({ sessionId: cartSessionId });
  const createOrder = useCreateOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
    }
  });

  const onSubmit = (data: CheckoutForm) => {
    if (!cart || cart.items.length === 0) return;
    
    createOrder.mutate({
      data: {
        ...data,
        sessionId: cartSessionId,
        userId: user?.id,
      }
    }, {
      onSuccess: (res) => {
        // Mocking Razorpay flow completion
        toast({ title: "Order Placed Successfully!" });
        setLocation(`/order-success?id=${res.order.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to process order", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <AppLayout><div className="min-h-[50vh] flex items-center justify-center">Loading checkout...</div></AppLayout>;
  if (!cart || cart.items.length === 0) {
    setLocation('/cart');
    return null;
  }

  const total = cart.total + (cart.total >= 50 ? 0 : 5); // Simple shipping logic

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-display">Secure Checkout</h1>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Encrypted and Secure
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50">
              <h2 className="text-xl font-bold mb-6">Contact & Shipping Info</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name</Label>
                    <Input id="customerName" {...register("customerName")} className={errors.customerName ? "border-destructive" : ""} />
                    {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input id="customerPhone" {...register("customerPhone")} className={errors.customerPhone ? "border-destructive" : ""} />
                    {errors.customerPhone && <p className="text-xs text-destructive">{errors.customerPhone.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <Input id="customerEmail" type="email" {...register("customerEmail")} className={errors.customerEmail ? "border-destructive" : ""} />
                  {errors.customerEmail && <p className="text-xs text-destructive">{errors.customerEmail.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" {...register("address")} className={errors.address ? "border-destructive" : ""} />
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} className={errors.city ? "border-destructive" : ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register("state")} className={errors.state ? "border-destructive" : ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input id="pincode" {...register("pincode")} className={errors.pincode ? "border-destructive" : ""} />
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div>
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-8 sticky top-28">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <ul className="divide-y divide-border mb-6">
                {cart.items.map(item => (
                  <li key={item.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden relative border border-border/50">
                        <img src={item.productImage || 'https://via.placeholder.com/150'} alt={item.productName} className="w-full h-full object-cover" />
                        <div className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-card">{item.quantity}</div>
                      </div>
                      <span className="font-medium text-sm">{item.productName}</span>
                    </div>
                    <span className="font-bold text-sm">${((item.discountPrice || item.price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 text-sm border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{cart.total >= 50 ? 'Free' : '$5.00'}</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold mb-8 border-t border-border pt-4">
                <span>Total to Pay</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              <Button 
                type="submit" 
                form="checkout-form"
                disabled={createOrder.isPending}
                size="lg" 
                className="w-full h-14 rounded-xl shadow-lg shadow-primary/25 text-lg"
              >
                {createOrder.isPending ? "Processing..." : "Pay with Razorpay"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
