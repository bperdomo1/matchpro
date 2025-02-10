
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { SeasonalScopeSettings } from "./SeasonalScopeSettings";

export function OrganizationSettingsForm() {
  const form = useForm({
    defaultValues: {
      organizationName: "",
      contactEmail: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (data) => {
    // Handle form submission
    console.log(data);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>

      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Seasonal Settings</h3>
        {/* Ensure SeasonalScopeSettings is rendered within proper React Context */}
        <div className="seasonal-settings-wrapper">
          <SeasonalScopeSettings />
        </div>
      </div>
      {/* Add Toaster component at root level */}
      <Toaster />
    </div>
  );
}
