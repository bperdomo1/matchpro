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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [showRoleChangeConfirm, setShowRoleChangeConfirm] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<string[]>([]);

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
    mutationFn: async (data: AdminFormValues & { id: number }) => {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/admin/administrators/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            roles: data.roles,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to update administrator');
        }

        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/administrators'] });
      toast({
        title: "Success",
        description: "Administrator updated successfully",
      });
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

  const createAdminMutation = useMutation({
    mutationFn: async (data: AdminFormValues) => {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/admin/administrators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create administrator');
        }

        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/administrators'] });
      toast({
        title: "Success",
        description: "Administrator created successfully",
      });
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

  const handleRoleChange = (roleId: string) => {
    const currentRoles = form.getValues("roles");
    let newRoles: string[];

    // If current admin is a super_admin and we're changing roles
    if (adminToEdit?.roles.includes("super_admin") && !currentRoles.includes(roleId)) {
      setPendingRoleChange([roleId]);
      setShowRoleChangeConfirm(true);
      return;
    }

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

  const handleRoleChangeConfirm = () => {
    if (pendingRoleChange.length > 0) {
      form.setValue("roles", pendingRoleChange, { shouldValidate: true });
    }
    setShowRoleChangeConfirm(false);
    setPendingRoleChange([]);
  };

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
        await updateAdminMutation.mutateAsync({
          ...data,
          id: adminToEdit.id,
        });
      } else {
        await createAdminMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const currentRoles = form.watch("roles");
  const isSuperAdmin = currentRoles.includes("super_admin");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {adminToEdit ? 'Edit Administrator' : 'Add New Administrator'}
            </DialogTitle>
            <DialogDescription>
              {adminToEdit
                ? 'Update the administrator details and roles below.'
                : 'Create a new administrator by filling out the information below.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                      <Input
                        {...field}
                        type="email"
                        onChange={(e) => {
                          field.onChange(e);
                          handleEmailChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roles</FormLabel>
                    <FormDescription>
                      Select one or more roles for this administrator
                    </FormDescription>
                    <div className="space-y-2">
                      {availableRoles.map((role) => {
                        const isSelected = field.value.includes(role.id);
                        return (
                          <div
                            key={role.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-input hover:bg-accent"
                            }`}
                            onClick={() => handleRoleChange(role.id)}
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
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {adminToEdit ? 'Update Administrator' : 'Create Administrator'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRoleChangeConfirm} onOpenChange={setShowRoleChangeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the Super Admin role? This action will change the administrator's permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRoleChangeConfirm(false);
              setPendingRoleChange([]);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChangeConfirm}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}