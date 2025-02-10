
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface AgeGroup {
  id: string;
  birthYear: number;
  ageGroup: string;
  divisionCode: string;
}

interface SeasonalScope {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  ageGroups: AgeGroup[];
}

export function SeasonalScopeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStartYear, setSelectedStartYear] = useState<string>("");
  const [selectedEndYear, setSelectedEndYear] = useState<string>("");
  const [scopeName, setScopeName] = useState<string>("");

  const scopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    }
  });

  const createScopeMutation = useMutation({
    mutationFn: async (data: Partial<SeasonalScope>) => {
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
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedStartYear("");
    setSelectedEndYear("");
    setScopeName("");
  };

  const calculateAgeGroups = (endYear: number): AgeGroup[] => {
    const ageGroups: AgeGroup[] = [];
    const birthYears = Array.from({ length: 17 }, (_, i) => endYear - (i + 4));

    birthYears.forEach(birthYear => {
      const age = endYear - birthYear;
      ['Boys', 'Girls'].forEach(gender => {
        const prefix = gender === 'Boys' ? 'B' : 'G';
        ageGroups.push({
          id: `${prefix}${birthYear}`,
          birthYear,
          ageGroup: `U${age}`,
          divisionCode: `${prefix}${birthYear}`
        });
      });
    });

    return ageGroups.sort((a, b) => b.birthYear - a.birthYear);
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
      const endYear = parseInt(selectedEndYear);
      const ageGroups = calculateAgeGroups(endYear);

      await createScopeMutation.mutateAsync({
        name: scopeName,
        startYear: parseInt(selectedStartYear),
        endYear: endYear,
        ageGroups: ageGroups
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create seasonal scope",
        variant: "destructive"
      });
    }
  };

  return (
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
            onChange={(e) => setSelectedEndYear(e.target.value)}
            placeholder="2025"
          />
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Create Scope
      </Button>

      {scopesQuery.data?.map((scope: SeasonalScope) => (
        <Card key={scope.id} className="mt-4">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">{scope.name}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Division Code</TableHead>
                  <TableHead>Birth Year</TableHead>
                  <TableHead>Age Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scope.ageGroups?.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>{group.divisionCode}</TableCell>
                    <TableCell>{group.birthYear}</TableCell>
                    <TableCell>{group.ageGroup}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
