
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";

export function ThemeEditor() {
  const { styleConfig, updateStyleConfig } = useTheme();
  const { toast } = useToast();
  const [colors, setColors] = useState({
    primary: "#000000",
    secondary: "#32CD32",
    background: "#F5F5F6",
    text: "#1C1C1E",
    accent: "#FF9500",
    success: "#34C759",
    warning: "#FF9500",
    destructive: "#FF3B30",
    muted: "#8E8E93",
    border: "#C6C6C8",
  });

  useEffect(() => {
    if (styleConfig) {
      setColors(prev => ({
        ...prev,
        ...styleConfig
      }));
    }
  }, [styleConfig]);

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
    { key: "primary", label: "Primary Color (Buttons & Links)" },
    { key: "secondary", label: "Secondary Color (Highlights)" },
    { key: "background", label: "Background Color" },
    { key: "text", label: "Text Color" },
    { key: "accent", label: "Accent Color (Special Elements)" },
    { key: "success", label: "Success Color (Confirmations)" },
    { key: "warning", label: "Warning Color (Alerts)" },
    { key: "destructive", label: "Destructive Color (Errors & Delete)" },
    { key: "muted", label: "Muted Color (Subtle Text)" },
    { key: "border", label: "Border Color" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Colors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <div className="flex gap-2">
                <Input
                  id={key}
                  type="color"
                  value={colors[key as keyof typeof colors]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-12 h-12 p-1"
                />
                <Input
                  value={colors[key as keyof typeof colors]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} className="mt-6">
          Save Theme Colors
        </Button>
      </CardContent>
    </Card>
  );
}
