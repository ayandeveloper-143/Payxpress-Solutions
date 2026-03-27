import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { ApiRequestError, verifyForgotPassword } from "@/lib/api";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token") ?? "";

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "Reset link is missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      form.clearErrors();
      await verifyForgotPassword({ token, newPassword: values.newPassword });
      setSuccess(true);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.field === "newPassword" || error.field === "password") {
          form.setError("newPassword", { type: "server", message: error.message });
        }

        if (error.field === "confirmPassword") {
          form.setError("confirmPassword", { type: "server", message: error.message });
        }

        if (error.errors?.newPassword?.[0]) {
          form.setError("newPassword", { type: "server", message: error.errors.newPassword[0] });
        }

        if (error.errors?.confirmPassword?.[0]) {
          form.setError("confirmPassword", { type: "server", message: error.errors.confirmPassword[0] });
        }

        if (error.errors?.token?.[0]) {
          toast({
            title: "Invalid Link",
            description: error.errors.token[0],
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm text-center space-y-4 sm:p-8">
          <p className="text-muted-foreground text-sm">
            This reset link is invalid. Please request a new one.
          </p>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/auth")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              {success ? <CheckCircle2 size={18} /> : <KeyRound size={18} />}
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                {success ? "Password Updated" : "Set New Password"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {success
                  ? "Your password has been reset successfully."
                  : "Enter your new password below."}
              </p>
            </div>
          </div>

          {success ? (
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => navigate("/auth")}
            >
              Go to Login
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Reset Password
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
