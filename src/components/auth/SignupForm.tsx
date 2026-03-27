import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ApiRequestError } from "@/lib/api";
import { UserPlus } from "lucide-react";

const signupSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormProps {
    onSuccess?: () => void;
    onToggleForm?: () => void;
}

const SignupForm = ({ onToggleForm }: SignupFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const { toast } = useToast();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: SignupFormValues) => {
        try {
            setIsLoading(true);
            form.clearErrors();
            const response = await signup(values.email, values.password, values.name);

            if (!response.requiresEmailVerification) {
                throw new Error("Unable to send verification link.");
            }

            toast({
                title: "Verification Link Sent",
                description: "Please check your email and click the verification link.",
            });
            onToggleForm?.();
        } catch (error) {
            if (error instanceof ApiRequestError) {
                if (error.field === "email") {
                    form.setError("email", { type: "server", message: error.message });
                }

                if (error.field === "name") {
                    form.setError("name", { type: "server", message: error.message });
                }

                if (error.field === "password") {
                    form.setError("password", { type: "server", message: error.message });
                }

                if (error.errors) {
                    const nameError = error.errors.name?.[0];
                    const emailError = error.errors.email?.[0];
                    const passwordError = error.errors.password?.[0];

                    if (nameError) {
                        form.setError("name", { type: "server", message: nameError });
                    }

                    if (emailError) {
                        form.setError("email", { type: "server", message: emailError });
                    }

                    if (passwordError) {
                        form.setError("password", { type: "server", message: passwordError });
                    }
                }
            }

            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Signup failed",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                <div className="mb-6 space-y-3 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <UserPlus size={18} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
                        <p className="text-muted-foreground text-sm">Start with PayXpress Solutions in minutes</p>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="you@example.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input placeholder="••••••••" type="password" {...field} />
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
                                        <Input placeholder="••••••••" type="password" {...field} />
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
                            Sign Up
                        </Button>
                    </form>
                </Form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button type="button" className="font-medium text-accent hover:underline" onClick={onToggleForm}>
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignupForm;
