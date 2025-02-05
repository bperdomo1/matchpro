
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
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false
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

  if (eventQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive font-medium">Failed to load event details</p>
        <Button
          onClick={() => navigate("/admin")}
          variant="link"
          className="text-primary"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <EventForm
        initialData={eventQuery.data}
        onSubmit={(data) => updateEventMutation.mutate(data)}
        isEdit={true}
      />
    </div>
  );
}
