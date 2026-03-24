import { AppLayout } from "@/components/layout/AppLayout";
import { useListFaq } from "@workspace/api-client-react";
import { ChevronDown } from "lucide-react";

export default function FaqPage() {
  const { data: faqs, isLoading } = useListFaq();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold font-display mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">Everything you need to know about our natural products and services.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {faqs?.map((faq) => (
              <details key={faq.id} className="group bg-card rounded-xl border border-border/50 shadow-sm p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-bold text-lg text-foreground outline-none">
                  {faq.question}
                  <span className="shrink-0 ml-4 rounded-full bg-primary/10 p-2 text-primary transition duration-300 group-open:-rotate-180">
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
