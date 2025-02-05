import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { EventForm } from "@/components/forms/EventForm";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    mutationFn: async (data: any) => {
      const formData = new FormData();

      // Handle the logo file if it exists
      if (data.branding?.logo instanceof File) {
        formData.append('logo', data.branding.logo);
      }

      // Remove the logo File object before stringifying
      const dataToSend = {
        ...data,
        branding: {
          ...data.branding,
          logo: undefined // Remove the File object
        }
      };

      formData.append('data', JSON.stringify(dataToSend));

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
              onSubmit={updateEventMutation.mutate}
              isEdit={true}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}