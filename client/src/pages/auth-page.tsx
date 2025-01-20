import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type InsertUser } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { SoccerFieldBackground } from "@/components/ui/SoccerFieldBackground";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { HelpButton } from "@/components/ui/help-button";

// Shared password schema
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
});

// Registration schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords must match",
      path: ["confirmPassword"],
    });
  }
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

// Function to check email availability
async function checkEmailAvailability(email: string): Promise<{ available: boolean }> {
  const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to check email availability");
  }
  return response.json();
}

export default function AuthPage() {
  const { toast } = useToast();
  const { login, register: registerUser } = useUser();
  const [isRegistering, setIsRegistering] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [inputFocus, setInputFocus] = useState<{
    email: boolean;
    username: boolean;
  }>({
    email: false,
    username: false,
  });

  // Email availability check mutation
  const emailCheckMutation = useMutation({
    mutationFn: checkEmailAvailability,
    onError: (error) => {
      console.error("Email check failed:", error);
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  async function onSubmit(data: LoginFormData | RegisterFormData) {
    try {
      if (isRegistering) {
        const { confirmPassword, ...registerData } = data as RegisterFormData;
        const submitData: InsertUser = {
          ...registerData,
          phone: registerData.phone || null,
          createdAt: new Date().toISOString(),
        };

        const result = await registerUser(submitData);
        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
          return;
        }
      } else {
        const loginData = data as LoginFormData;
        const result = await login({
          username: loginData.email,
          password: loginData.password,
          email: loginData.email,
          firstName: "",
          lastName: "",
          phone: null,
          isParent: false,
          isAdmin: false,
          createdAt: new Date().toISOString(),
        });

        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: isRegistering ? "Registration successful" : "Login successful",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <SoccerFieldBackground className="opacity-50" />
      <div className="container max-w-lg mx-auto relative z-10">
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <Trophy className="h-16 w-16 text-green-600 mb-4" />
              <CardTitle className="text-3xl font-bold">Sign In to MatchPro</CardTitle>
            </div>
            <div className="absolute top-4 right-4">
              <HelpButton
                title={isRegistering ? "Registration Help" : "Login Help"}
                content={
                  isRegistering ? (
                    <div className="space-y-2">
                      <p>To register for the soccer system:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Fill in all required fields marked with *</li>
                        <li>Password must be at least 8 characters with numbers and special characters</li>
                        <li>Your email will be used for account verification</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>To log in to your account:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Enter your registered email address</li>
                        <li>Enter your password</li>
                        <li>Click "Forgot Password?" if you need to reset</li>
                      </ul>
                    </div>
                  )
                }
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={isRegistering ? "register" : "login"}
              onValueChange={(v) => {
                setIsRegistering(v === "register");
                loginForm.reset();
                registerForm.reset();
                setPasswordMatch(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {isRegistering ? (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email Field */}
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              className={`${
                                inputFocus.email ? 'border-primary ring-2 ring-primary/20' : ''
                              } ${
                                registerForm.formState.errors.email ? 'border-red-500' : ''
                              }`}
                              {...field}
                              onFocus={() => setInputFocus(prev => ({ ...prev, email: true }))}
                              onBlur={(e) => {
                                field.onBlur();
                                setInputFocus(prev => ({ ...prev, email: false }));
                                const email = e.target.value;
                                if (email && email.includes('@')) {
                                  emailCheckMutation.mutate(email);
                                }
                              }}
                              onChange={(e) => {
                                field.onChange(e);
                                const email = e.target.value;
                                if (email && email.includes('@')) {
                                  emailCheckMutation.mutate(email);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {emailCheckMutation.data?.available === false && (
                            <p className="text-sm text-red-500 mt-1">
                              This email is already registered
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* Username Field */}
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Choose a username"
                              className={`${
                                inputFocus.username ? 'border-primary ring-2 ring-primary/20' : ''
                              } ${
                                registerForm.formState.errors.username ? 'border-red-500' : ''
                              }`}
                              {...field}
                              onFocus={() => setInputFocus(prev => ({ ...prev, username: true }))}
                              onBlur={() => {
                                field.onBlur();
                                setInputFocus(prev => ({ ...prev, username: false }));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {field.value && field.value.length < 3 && (
                            <p className="text-sm text-amber-500 mt-1">
                              Username must be at least 3 characters
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* Password Field */}
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                const confirmPassword = registerForm.getValues("confirmPassword");
                                if (confirmPassword) {
                                  setPasswordMatch(e.target.value === confirmPassword);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Must be at least 8 characters with a number and special character
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confirm Password Field */}
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm your password"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                const password = registerForm.getValues("password");
                                setPasswordMatch(e.target.value === password);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {passwordMatch === false && (
                            <p className="text-sm text-red-500 mt-1">
                              Passwords do not match
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* First Name Field */}
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Last Name Field */}
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone Field */}
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field: { value, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Enter your phone number"
                              {...fieldProps}
                              value={value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      Register
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      Login
                    </Button>
                  </form>
                </Form>
              )}

              {!isRegistering && (
                <div className="text-center mt-4">
                  <Link href="/forgot-password">
                    <Button variant="link" className="text-sm text-green-600" type="button">
                      Forgot Password?
                    </Button>
                  </Link>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}