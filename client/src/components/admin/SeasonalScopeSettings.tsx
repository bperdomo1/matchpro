
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgeGroup {
  birthYear: number;
  division: string;
}

interface SeasonalScope {
  name: string;
  startYear: number;
  endYear: number;
}

export function SeasonalScopeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStartYear, setSelectedStartYear] = useState<string>("");
  const [selectedEndYear, setSelectedEndYear] = useState<string>("");
  const [scopeName, setScopeName] = useState<string>("");
  const [birthYearMappings, setBirthYearMappings] = useState<{[key: number]: string}>({});

  const scopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    }
  });

  const createScopeMutation = useMutation({
    mutationFn: async (data: SeasonalScope) => {
      const response = await fetch('/api/admin/seasonal-scopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create seasonal scope');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/seasonal-scopes']);
      toast({ title: "Success", description: "Seasonal scope created successfully" });
      setSelectedStartYear("");
      setSelectedEndYear("");
      setScopeName("");
      setBirthYearMappings({});
    },
  });

  const generateBirthYears = (endYear: number) => {
    return Array.from({ length: 17 }, (_, i) => endYear - i).reverse();
  };

  const handleAgeGroupChange = (birthYear: number, division: string) => {
    setBirthYearMappings(prev => ({
      ...prev,
      [birthYear]: division
    }));
  };

  const handleSubmit = async () => {
    if (!scopeName || !selectedStartYear || !selectedEndYear) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await createScopeMutation.mutateAsync({
        name: scopeName,
        startYear: parseInt(selectedStartYear),
        endYear: parseInt(selectedEndYear)
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create seasonal scope",
        variant: "destructive"
      });
    }
  };

  const divisions = ["U6", "U7", "U8", "U9", "U10", "U12", "U14", "U16"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasonal Scope Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={scopeName}
                onChange={(e) => setScopeName(e.target.value)}
                placeholder="2024-2025 Season"
              />
            </div>
            <div>
              <Label>Start Year</Label>
              <Input
                type="number"
                value={selectedStartYear}
                onChange={(e) => setSelectedStartYear(e.target.value)}
                placeholder="2024"
              />
            </div>
            <div>
              <Label>End Year</Label>
              <Input
                type="number"
                value={selectedEndYear}
                onChange={(e) => {
                  setSelectedEndYear(e.target.value);
                  if (e.target.value) {
                    const years = generateBirthYears(parseInt(e.target.value));
                    const initialMappings: {[key: number]: string} = {};
                    years.forEach(year => {
                      initialMappings[year] = "";
                    });
                    setBirthYearMappings(initialMappings);
                  }
                }}
                placeholder="2025"
              />
            </div>
          </div>

          {selectedEndYear && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Birth Year</TableHead>
                      <TableHead>Age in {selectedEndYear}</TableHead>
                      <TableHead>Division</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generateBirthYears(parseInt(selectedEndYear)).map((birthYear) => (
                      <TableRow key={birthYear}>
                        <TableCell>{birthYear}</TableCell>
                        <TableCell>{parseInt(selectedEndYear) - birthYear}</TableCell>
                        <TableCell>
                          <Select
                            value={birthYearMappings[birthYear] || ""}
                            onValueChange={(value) => handleAgeGroupChange(birthYear, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                              {divisions.map((div) => (
                                <SelectItem key={div} value={div}>
                                  {div}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleSubmit}
            className="w-full mt-4"
            disabled={createScopeMutation.isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createScopeMutation.isLoading ? "Adding..." : "Add Scope"}
          </Button>

          {scopesQuery.data?.map((scope: any) => (
            <Card key={scope.id} className="mt-4">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">{scope.name}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Birth Year</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Age in {scope.endYear}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generateBirthYears(scope.endYear).map((birthYear) => (
                      <TableRow key={birthYear}>
                        <TableCell>{birthYear}</TableCell>
                        <TableCell>{birthYearMappings[birthYear] || "-"}</TableCell>
                        <TableCell>{scope.endYear - birthYear}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
