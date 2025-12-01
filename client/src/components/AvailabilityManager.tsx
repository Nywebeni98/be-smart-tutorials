import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { insertAvailabilitySchema, type InsertAvailability, type Availability } from '@shared/schema';
import { Trash2, Plus, Calendar } from 'lucide-react';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AvailabilityManager() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<InsertAvailability>({
    resolver: zodResolver(insertAvailabilitySchema),
    defaultValues: {
      day: '',
      startTime: '',
      endTime: '',
    },
  });

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch('/api/availability');
      if (response.ok) {
        const data = await response.json();
        setAvailabilities(data);
      }
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: InsertAvailability) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Availability added successfully',
        });
        form.reset();
        await fetchAvailabilities();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add availability',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add availability',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/availability/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({
          title: 'Deleted',
          description: 'Availability removed',
        });
        await fetchAvailabilities();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete availability',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 
            className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl mb-4"
            style={{ color: 'hsl(var(--brand-blue))' }}
            data-testid="text-availability-heading"
          >
            Manage Your Availability
          </h2>
          <p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            data-testid="text-availability-description"
          >
            Set the days and times when you're available for tutoring sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Availability Form */}
          <Card className="border-2" style={{ borderColor: 'hsl(var(--brand-yellow))' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--brand-yellow))' }}>
                <Plus className="w-5 h-5" />
                Add Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-day">
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {days.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <input 
                            type="time" 
                            {...field} 
                            data-testid="input-start-time"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <input 
                            type="time" 
                            {...field} 
                            data-testid="input-end-time"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                    style={{ backgroundColor: 'hsl(var(--brand-yellow))' }}
                    data-testid="button-add-availability"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Time Slot'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Current Availabilities */}
          <Card className="border-2" style={{ borderColor: 'hsl(var(--brand-orange))' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--brand-orange))' }}>
                <Calendar className="w-5 h-5" />
                Your Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading schedule...</p>
              ) : availabilities.length === 0 ? (
                <p className="text-muted-foreground">No availability set yet</p>
              ) : (
                <div className="space-y-3">
                  {availabilities.map((av) => (
                    <div 
                      key={av.id} 
                      className="flex items-center justify-between p-3 border rounded-md bg-card hover-elevate"
                      data-testid={`availability-${av.id}`}
                    >
                      <div>
                        <p className="font-medium">{av.day}</p>
                        <p className="text-sm text-muted-foreground">{av.startTime} - {av.endTime}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(av.id)}
                        data-testid={`button-delete-${av.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
