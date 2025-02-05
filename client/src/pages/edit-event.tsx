
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { EventForm } from "@/components/forms/EventForm";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }
      const data = await response.json();
      if (!data) {
        throw new Error('No event data found');
      }
      return {
        ...data,
        startDate: data.startDate?.split('T')[0] || '',
        endDate: data.endDate?.split('T')[0] || '',
        applicationDeadline: data.applicationDeadline?.split('T')[0] || '',
      };
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const updateEventMutation = useMutation({
    mutationKey: ['updateEvent', id],
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));

      if (data.branding?.logo instanceof File) {
        formData.append('logo', data.branding.logo);
      }

      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      navigate("/admin");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Edit Event</h2>
      </div>

      <Card>
        <CardContent className="p-6">
          {eventQuery.isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : eventQuery.error ? (
            <div className="text-center text-destructive space-y-4">
              <p>Failed to load event details</p>
              <Button onClick={() => navigate("/admin")}>Return to Dashboard</Button>
            </div>
          ) : eventQuery.data ? (
            <EventForm
              initialData={eventQuery.data}
              onSubmit={(data) => updateEventMutation.mutate(data)}
              isEdit={true}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
