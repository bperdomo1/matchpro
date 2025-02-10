
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
  const [newScope, setNewScope] = useState({ name: "", startYear: "", endYear: "" });

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
      setNewScope({ name: "", startYear: "", endYear: "" });
    },
  });

  const calculateMatrixAgeGroups = (endYear: number): AgeGroup[] => {
    const ageGroups: AgeGroup[] = [];
    const currentYear = endYear;
    
    // Generate age groups based on birth year
    for (let birthYear = currentYear - 20; birthYear <= currentYear; birthYear++) {
      const age = currentYear - birthYear;
      let division = '';

      // Determine division based on age according to the matrix pattern
      if (age <= 5) division = `U${age}`;
      else if (age <= 8) division = `U${age}`;
      else if (age <= 10) division = 'U10';
      else if (age <= 12) division = 'U12';
      else if (age <= 14) division = 'U14';
      else if (age <= 16) division = 'U16';
      else continue; // Skip ages above 16

      if (division) {
        ageGroups.push({
          birthYear,
          division,
        });
      }
    }

    return ageGroups.sort((a, b) => b.birthYear - a.birthYear);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasonal Scope Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newScope.name}
                onChange={(e) => setNewScope({ ...newScope, name: e.target.value })}
                placeholder="2024-2025 Season"
              />
            </div>
            <div>
              <Label>Start Year</Label>
              <Input
                type="number"
                value={newScope.startYear}
                onChange={(e) => setNewScope({ ...newScope, startYear: e.target.value })}
                placeholder="2024"
              />
            </div>
            <div>
              <Label>End Year</Label>
              <Input
                type="number"
                value={newScope.endYear}
                onChange={(e) => setNewScope({ ...newScope, endYear: e.target.value })}
                placeholder="2025"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={async () => {
                  try {
                    if (!newScope.name || !newScope.startYear || !newScope.endYear) {
                      toast({
                        title: "Error",
                        description: "Please fill in all fields",
                        variant: "destructive"
                      });
                      return;
                    }

                    await createScopeMutation.mutateAsync({
                      name: newScope.name,
                      startYear: parseInt(newScope.startYear),
                      endYear: parseInt(newScope.endYear)
                    });

                    setNewScope({ name: "", startYear: "", endYear: "" });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to create seasonal scope",
                      variant: "destructive"
                    });
                  }
                }}
                className="w-full"
                disabled={createScopeMutation.isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createScopeMutation.isLoading ? "Adding..." : "Add Scope"}
              </Button>
            </div>
          </div>

          {scopesQuery.data?.map((scope) => (
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
                    {calculateMatrixAgeGroups(scope.endYear).map((group) => (
                      <TableRow key={group.birthYear}>
                        <TableCell>{group.birthYear}</TableCell>
                        <TableCell>{group.division}</TableCell>
                        <TableCell>{scope.endYear - group.birthYear}</TableCell>
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
