
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export function ThemeEditor() {
  const { styleConfig, updateStyleConfig } = useTheme();
  const { toast } = useToast();
  const [colors, setColors] = useState({
    primary: styleConfig?.primary || "#1E88E5",
    secondary: styleConfig?.secondary || "#43A047",
    background: styleConfig?.background || "#F5F5F6",
    text: styleConfig?.text || "#1C1C1E",
    accent: styleConfig?.accent || "#FF9500",
    success: styleConfig?.success || "#34C759",
    warning: styleConfig?.warning || "#FF9500",
    destructive: styleConfig?.destructive || "#FF3B30",
    muted: styleConfig?.muted || "#8E8E93",
    border: styleConfig?.border || "#C6C6C8",
  });

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateStyleConfig(colors);
      toast({
        title: "Success",
        description: "Theme colors updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update theme colors",
      });
    }
  };

  const colorFields = [
    { key: "primary", label: "Primary Color", description: "Main brand color for buttons & links" },
    { key: "secondary", label: "Secondary Color", description: "Used for highlights and accents" },
    { key: "background", label: "Background Color", description: "Main page background" },
    { key: "text", label: "Text Color", description: "Primary text color" },
    { key: "accent", label: "Accent Color", description: "Special UI elements" },
    { key: "success", label: "Success Color", description: "Positive actions and confirmations" },
    { key: "warning", label: "Warning Color", description: "Alerts and warnings" },
    { key: "destructive", label: "Destructive Color", description: "Error messages and delete actions" },
    { key: "muted", label: "Muted Color", description: "Secondary text and disabled states" },
    { key: "border", label: "Border Color", description: "Dividers and borders" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Theme Editor</h2>
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {colorFields.map(({ key, label, description }) => (
          <Card key={key} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{label}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Input
                    type="color"
                    value={colors[key as keyof typeof colors]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-16 h-16 p-1 rounded-lg"
                  />
                </div>
                <div className="flex-grow">
                  <Label htmlFor={`hex-${key}`}>Hex Value</Label>
                  <Input
                    id={`hex-${key}`}
                    value={colors[key as keyof typeof colors].toUpperCase()}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="font-mono uppercase"
                    maxLength={7}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
