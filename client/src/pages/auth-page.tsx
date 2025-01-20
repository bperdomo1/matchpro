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
import { useMutation } from "@tanstack/react-query";

// Registration schema
const registerSchema = z.object({
  registrationEmail: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
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

// Login schema
const loginSchema = z.object({
  loginEmail: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
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
      loginEmail: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      registrationEmail: "",
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  async function onSubmit(data: LoginFormData | RegisterFormData) {
    try {
      if (isRegistering) {
        const { confirmPassword, registrationEmail, ...registerData } = data as RegisterFormData;
        const submitData: InsertUser = {
          username: registerData.username,
          email: registrationEmail,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          phone: registerData.phone || null,
          isParent: false,
          isAdmin: false,
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
          username: loginData.loginEmail,
          password: loginData.password,
          email: loginData.loginEmail,
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
          </CardHeader>
          <CardContent>
            <Tabs
              value={isRegistering ? "register" : "login"}
              onValueChange={(v) => setIsRegistering(v === "register")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {isRegistering ? (
                <Form {...registerForm}>
                  <form 
                    onSubmit={registerForm.handleSubmit(onSubmit)} 
                    className="space-y-4"
                    id="register-form"
                    name="register"
                    autoComplete="off"
                  >
                    <FormField
                      control={registerForm.control}
                      name="registrationEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="off"
                              {...field}
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
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username *</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Must be at least 8 characters with a number and special character
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              autoComplete="off"
                              {...field}
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
                  <form 
                    onSubmit={loginForm.handleSubmit(onSubmit)} 
                    className="space-y-4"
                    id="login-form"
                    name="login"
                  >
                    <FormField
                      control={loginForm.control}
                      name="loginEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="username"
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
                              autoComplete="current-password"
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}