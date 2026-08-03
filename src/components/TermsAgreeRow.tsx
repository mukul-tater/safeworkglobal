type TermsAgreeRowProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onOpenTerms: () => void;
  className?: string;
};

/**
 * Checkbox + “I agree…” row that stays vertically aligned on mobile/tablet.
 * Uses a native checkbox (not Radix button) so coarse-pointer min-height:44px
 * rules cannot inflate the control or the terms link.
 */
export default function TermsAgreeRow({
  id,
  checked,
  onCheckedChange,
  onOpenTerms,
  className = '',
}: TermsAgreeRowProps) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-2.5 py-2.5 ${className}`.trim()}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          const on = e.target.checked;
          onCheckedChange(on);
          if (on) onOpenTerms();
        }}
        className="terms-agree-check m-0 size-4 shrink-0 cursor-pointer rounded-sm border border-primary accent-primary"
      />
      <label htmlFor={id} className="m-0 min-w-0 flex-1 cursor-pointer text-sm font-normal leading-4 text-muted-foreground">
        I agree to the{' '}
        <span
          role="link"
          tabIndex={0}
          className="font-medium text-primary underline-offset-2 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenTerms();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onOpenTerms();
            }
          }}
        >
          terms &amp; declarations
        </span>
      </label>
    </div>
  );
}
