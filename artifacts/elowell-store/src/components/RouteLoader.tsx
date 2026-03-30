import { Loader2 } from "lucide-react";

interface RouteLoaderProps {
  message?: string;
}

export function RouteLoader({ message = "Loading..." }: RouteLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          <Loader2 className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-muted-foreground font-medium">{message}</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

export function AdminRouteLoader() {
  return <RouteLoader message="Loading admin panel..." />;
}

export function PageRouteLoader() {
  return <RouteLoader message="Loading page..." />;
}