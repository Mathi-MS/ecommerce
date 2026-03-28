import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useListOrders } from "@workspace/api-client-react";
import { useApiOptions } from "@/store/session";
import { Package, Calendar, CreditCard, Truck } from "lucide-react";
import { Link } from "wouter";

export default function OrderHistory() {
  const apiOpts = useApiOptions();
  const { data: orders, isLoading } = useListOrders(undefined, apiOpts);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'default';
      case 'processing': return 'secondary';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <CreditCard className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        {orders?.length ? (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(order.status) as any} className="mb-2">
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </Badge>
                      <div className="text-lg font-semibold">&#8377;{order.total?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {order.items?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          {item.product?.images?.[0] && (
                            <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product?.name || 'Product'}</h4>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} &times; &#8377;{item.price?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">&#8377;{((item.quantity || 0) * (item.price || 0)).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.shippingAddress && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Shipping Address</h4>
                        <div className="text-sm text-muted-foreground">
                          <p>{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.street}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                          {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>&#8377;{(order.total - (order.shippingCost || 0)).toFixed(2)}</span>
                      </div>
                      {order.shippingCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Shipping:</span>
                          <span>&#8377;{order.shippingCost.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>&#8377;{order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {order.status === 'delivered' && <Button variant="outline" size="sm">Leave Review</Button>}
                      {['pending', 'processing'].includes(order.status.toLowerCase()) && <Button variant="outline" size="sm">Cancel Order</Button>}
                      <Button variant="outline" size="sm">Track Order</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">You haven't placed any orders yet. Start shopping to see your order history here.</p>
              <Button asChild><Link href="/products">Start Shopping</Link></Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
