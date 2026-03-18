// components/auth/login-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { loginUser } from "@/actions/auth";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const result = await loginUser(email);
      
      if (result.success) {
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error: any) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a href="#" className="flex flex-col items-center gap-3 font-medium">
              <Image
                src="/logo.png"
                width={180}
                height={180}
                alt="site_logo"
                className="object-contain"
                priority
              />
              <span className="sr-only">FMS</span>
            </a>

            <h1 className="text-xl font-bold">Eagle Trucking Fleet Hub</h1>
          </div>
          
          <Field>
            <FieldLabel htmlFor="email">Admin Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@company.com"
              required
            />
          </Field>

          <Field>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Login with Email"}
            </Button>
          </Field>
          
          <FieldSeparator>Admin access only • No password required</FieldSeparator>
          
        </FieldGroup>
      </form>
      
      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Security Notice</h4>
            <p className="text-sm text-yellow-800 mt-1">
              This system uses email-only authentication for administrators. 
              Only authorized admin emails will be granted access.
            </p>
          </div>
        </div>
      </div>
      
      <FieldDescription className="px-6 text-center">
        By logging in, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}