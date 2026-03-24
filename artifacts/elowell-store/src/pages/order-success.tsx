import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useLocation } from "wouter";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("id");

  return (
    <AppLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-10 rounded-3xl border border-border/50 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>
          
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary mb-6">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          
          <h1 className="text-3xl font-bold font-display mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-2">Thank you for choosing natural wellness.</p>
          <p className="text-muted-foreground mb-8">We've received your order and will begin processing it shortly.</p>
          
          {orderId && (
            <div className="bg-muted/50 p-4 rounded-xl mb-8 flex items-center justify-center gap-3 border border-border/50">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Order ID: <strong className="text-foreground">{orderId}</strong></span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button className="rounded-xl w-full sm:w-auto h-12 px-8 shadow-md">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
