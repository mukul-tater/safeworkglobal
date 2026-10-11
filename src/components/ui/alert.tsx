import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { WhatsAppSupportNote } from "@/components/WhatsAppSupportNote";
import { WHATSAPP_ERROR_PROMPT } from "@/lib/whatsappSupport";
import { cn } from "@/lib/utils";

function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join(" ");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return nodeText(props.children);
  }
  return "";
}

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => {
  const errorText = nodeText(children).replace(/\s+/g, " ").trim();
  const showWhatsApp = variant === "destructive" && !errorText.includes(WHATSAPP_ERROR_PROMPT);
  return (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {children}
      {showWhatsApp ? (
        <WhatsAppSupportNote kind="error" errorText={errorText} className="mt-2 text-xs" />
      ) : null}
    </div>
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
