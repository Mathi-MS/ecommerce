import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-9xl font-bold font-display text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">We couldn't find the page you're looking for. It might have been moved or doesn't exist.</p>
        <Link href="/">
          <Button size="lg" className="rounded-xl px-8">Return Home</Button>
        </Link>
      </div>
    </AppLayout>
  );
}
