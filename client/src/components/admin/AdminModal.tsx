import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { adminFormSchema } from "@db/schema";
import type { AdminFormValues } from "@db/schema";

const availableRoles = [
  { id: "super_admin", name: "Super Admin", description: "Full system access and overrides all other roles" },
  { id: "tournament_admin", name: "Tournament Admin", description: "Manage tournaments and events" },
  { id: "score_admin", name: "Score Admin", description: "Manage scores and results" },
  { id: "finance_admin", name: "Finance Admin", description: "Manage financial aspects" },
] as const;

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminToEdit?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export function AdminModal({ open, onOpenChange, adminToEdit }: AdminModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailToCheck, setEmailToCheck] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      firstName: adminToEdit?.firstName ?? "",
      lastName: adminToEdit?.lastName ?? "",
      email: adminToEdit?.email ?? "",
      password: "",
      roles: adminToEdit?.roles ?? [],
    },
  });

  useEffect(() => {
    if (adminToEdit) {
      form.reset({
        firstName: adminToEdit.firstName,
        lastName: adminToEdit.lastName,
        email: adminToEdit.email,
        password: "",
        roles: adminToEdit.roles,
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        roles: [],
      });
    }
  }, [adminToEdit, form]);

  const emailCheckQuery = useQuery({
    queryKey: ['checkAdminEmail', emailToCheck],
    queryFn: async () => {
      if (!emailToCheck || (adminToEdit && adminToEdit.email === emailToCheck)) return null;
      const response = await fetch(`/api/admin/check-email?email=${encodeURIComponent(emailToCheck)}`);
      if (!response.ok) throw new Error('Failed to check email');
      return response.json();
    },
    enabled: !!emailToCheck && emailToCheck.includes('@'),
  });

  const handleEmailChange = useCallback((email: string) => {
    setEmailToCheck(email);
  }, []);

  const updateAdminMutation = useMutation({
    mutationFn: async (data: AdminFormValues) => {
      if (!adminToEdit) throw new Error("No administrator to update");
      setIsSubmitting(true);

      try {
        const response = await fetch(`/api/admin/administrators/${adminToEdit.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            roles: data.roles,
            currentRoles: adminToEdit.roles, // Send current roles for validation
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "Failed to update administrator");
        }

        return responseData;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/administrators"] });
      toast({
        title: "Success",
        description: "Administrator updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Update error:', error);

      if (error.message.includes("LAST_SUPER_ADMIN")) {
        toast({
          title: "Cannot Update Role",
          description: "You cannot remove the super_admin role from the last super administrator",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update administrator",
          variant: "destructive",
        });
      }
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: AdminFormValues) => {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/admin/administrators", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "Failed to create administrator");
        }

        return responseData;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/administrators"] });
      toast({
        title: "Success",
        description: "Administrator created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AdminFormValues) => {
    if (emailCheckQuery.data?.exists && data.email !== adminToEdit?.email) {
      form.setError('email', {
        type: 'manual',
        message: 'This email is already registered'
      });
      return;
    }

    try {
      if (adminToEdit) {
        // Send current roles along with the update
        await updateAdminMutation.mutateAsync({
          ...data,
          roles: data.roles,
        });
      } else {
        await createAdminMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const toggleRole = (roleId: string) => {
    const currentRoles = form.getValues("roles");
    let newRoles: string[];

    if (roleId === "super_admin") {
      newRoles = currentRoles.includes("super_admin") ? [] : ["super_admin"];
    } else {
      if (currentRoles.includes("super_admin")) {
        newRoles = [roleId];
      } else {
        newRoles = currentRoles.includes(roleId)
          ? currentRoles.filter(id => id !== roleId)
          : [...currentRoles, roleId];
      }
    }

    form.setValue("roles", newRoles, { shouldValidate: true });
  };

  const currentRoles = form.watch("roles");
  const isSuperAdmin = currentRoles.includes("super_admin");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 sticky top-0 bg-background z-10 border-b">
          <DialogTitle>{adminToEdit ? 'Edit Administrator' : 'Add New Administrator'}</DialogTitle>
          <DialogDescription>
            {adminToEdit 
              ? 'Update the administrator details and roles below.' 
              : 'Create a new administrator by filling out the information below.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6">
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="john.doe@example.com"
                          onChange={(e) => {
                            field.onChange(e);
                            handleEmailChange(e.target.value);
                          }}
                        />
                        {emailCheckQuery.isLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {emailCheckQuery.data?.exists && field.value !== adminToEdit?.email && (
                      <p className="text-sm font-medium text-destructive">
                        This email is already registered
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Administrator Roles</FormLabel>
                    <FormDescription>
                      {isSuperAdmin 
                        ? "Super Admin role provides full access and overrides all other roles."
                        : "Select one or more roles. Super Admin overrides all other roles if selected."}
                    </FormDescription>
                    <FormControl>
                      <div className="space-y-2">
                        {availableRoles.map((role) => {
                          const isSelected = field.value.includes(role.id);
                          const isDisabled = isSuperAdmin && role.id !== "super_admin";

                          return (
                            <div
                              key={role.id}
                              className={`p-3 rounded-lg border transition-colors ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed border-input"
                                  : isSelected
                                  ? "border-primary bg-primary/5 cursor-pointer"
                                  : "border-input hover:bg-accent cursor-pointer"
                              }`}
                              onClick={() => !isDisabled && toggleRole(role.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{role.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {role.description}
                                  </p>
                                </div>
                                {isSelected && (
                                  <Badge variant="secondary">Selected</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!adminToEdit && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Minimum 8 characters" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isSubmitting ||
                  emailCheckQuery.isLoading || 
                  (emailCheckQuery.data?.exists && form.getValues("email") !== adminToEdit?.email)
                }
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {adminToEdit ? "Update Administrator" : "Create Administrator"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}