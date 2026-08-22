import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ValidatedInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  validation?: (value: string) => string | null;
  required?: boolean;
  className?: string;
}

export default function ValidatedInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  validation,
  required = false,
  className = ""
}: ValidatedInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (touched && validation) {
      const errorMsg = validation(value);
      setError(errorMsg);
      setIsValid(!errorMsg && value.length > 0);
    }
  }, [value, touched, validation]);

  const handleBlur = () => {
    setTouched(true);
    if (validation) {
      const errorMsg = validation(value);
      setError(errorMsg);
      setIsValid(!errorMsg && value.length > 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={className}>
      <Label htmlFor={label} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative mt-2">
        <Input
          id={label}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`pr-10 transition-all ${
            error && touched
              ? "border-destructive focus-visible:ring-destructive"
              : isValid
              ? "border-success focus-visible:ring-success"
              : ""
          }`}
        />
        {touched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {error ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : isValid ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : null}
          </div>
        )}
      </div>
      {error && touched && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Common validation functions
export const emailValidation = (value: string): string | null => {
  if (!value) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Invalid email format";
  return null;
};

export const phoneValidation = (value: string): string | null => {
  if (!value) return "Phone number is required";
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  if (!phoneRegex.test(value)) return "Invalid phone number";
  return null;
};

export const requiredValidation = (value: string): string | null => {
  if (!value || value.trim().length === 0) return "This field is required";
  return null;
};

export const minLengthValidation = (min: number) => (value: string): string | null => {
  if (!value) return "This field is required";
  if (value.length < min) return `Must be at least ${min} characters`;
  return null;
};

export { passwordSignupIssue as passwordValidation } from "@/lib/validations/password";
