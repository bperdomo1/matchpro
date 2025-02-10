
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SeasonalScopeSettings } from "./SeasonalScopeSettings";

export function GeneralSettingsView() {
  const { settings, isLoading, updateSettings } = useOrganizationSettings();
  const { toast } = useToast();
  const [name, setName] = useState(settings?.name || '');
  const [timeZone, setTimeZone] = useState(settings?.timeZone || '');

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('timeZone', timeZone);

      await updateSettings.mutateAsync(formData);

      toast({
        title: "Success",
        description: "General settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">General Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeZone">Time Zone</Label>
              <Input
                id="timeZone"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                placeholder="Enter time zone"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={updateSettings.isLoading}
              className="w-full"
            >
              {updateSettings.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="pt-6">
        <SeasonalScopeSettings />
      </div>
    </div>
  );
}
