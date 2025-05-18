'use client';

import { useState } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from '@/components/ModeToggle';

// Import Prisma types
import { 
  Service, 
  Incident,
  Organization
} from '@/lib/generated/prisma';


interface StatusPageData {
  organization: Organization;
  services: Service[];
  openIncidents: Incident[];
  closedIncidents: Incident[];
}

export default function StatusPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleString());
  
  // Fetch data using Tanstack Query
  const { data, isLoading, error } = useQuery<StatusPageData>({
    queryKey: ['statusPage', slug],
    queryFn: async () => {
      const response = await axios.get(`/api/public/organization/${slug}`);
      setLastUpdated(new Date().toLocaleString());
      return response.data;
    },
    refetchInterval: 1000, // Auto-refresh every 1 second
    refetchOnWindowFocus: true,
    enabled: !!slug,
  });
  
  // Calculate overall system status based on service statuses
  const calculateOverallStatus = () => {
    if (!data?.services || data.services.length === 0) return 'Unknown';
    
    if (data.services.some(service => service.status === 'Major Outage')) {
      return 'Major Outage';
    } else if (data.services.some(service => service.status === 'Partial Outage')) {
      return 'Partial Outage';
    } else if (data.services.some(service => service.status === 'Degraded Performance')) {
      return 'Degraded Performance';
    } else {
      return 'All Systems Operational';
    }
  };

  // Get the status icon based on the status string
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Degraded Performance':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'Partial Outage':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'Major Outage':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  // Get the color for the status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational':
      case 'All Systems Operational':
        return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900';
      case 'Degraded Performance':
        return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
      case 'Partial Outage':
        return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      case 'Major Outage':
        return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900';
      default:
        return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900';
    }
  };

  // Format date for display
  const formatDate = (dateString: any) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4 mx-auto" />
          <p className="text-muted-foreground">Loading status information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4 mx-auto" />
          <h1 className="text-xl font-semibold mb-2">Error</h1>
          <p className="text-muted-foreground">Failed to load status page. The organization may not exist or there was a server error.</p>
        </div>
      </div>
    );
  }

  const overallStatus = calculateOverallStatus();
  const statusColor = getStatusColor(overallStatus);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-5xl mx-auto px-4 flex h-16 items-center justify-between">
          <h1 className="text-xl font-semibold">
            {data?.organization?.name || 'System'} Status
          </h1>
          <ModeToggle />
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Overall Status Banner */}
        <div className={`flex items-center justify-center p-6 rounded-lg border ${statusColor}`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {getStatusIcon(overallStatus)}
              <h2 className="text-xl font-semibold">{overallStatus}</h2>
            </div>
            <p className="text-sm">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Services Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">Services</CardTitle>
            <CardDescription className="mt-1.5">
              Current status of all services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.services || data.services.length === 0 ? (
              <div className="text-center py-10 bg-muted/20 rounded-lg border">
                <p className="text-muted-foreground">No services available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.services.map((service) => (
                  <div key={service.id} className="flex flex-col p-4 rounded-lg border hover:bg-muted/10 transition-colors">
                    <span className="font-medium mb-2">{service.name}</span>
                    <div className={`self-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs ${
                      service.status === 'Operational' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' :
                      service.status === 'Degraded Performance' ? 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400' :
                      service.status === 'Partial Outage' ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400' :
                      'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                    }`}>
                      {getStatusIcon(service.status)}
                      <span>{service.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">Incidents</CardTitle>
            <CardDescription className="mt-1.5">
              Current and past incidents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Incidents */}
            <div>
              <h3 className="text-base font-semibold mb-4">Current Incidents</h3>
              {!data?.openIncidents || data.openIncidents.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No current incidents - all systems operational</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.openIncidents.map((incident) => (
                    <div key={incident.id} className="p-5 rounded-lg border border-red-200 dark:border-red-900 bg-muted/30">
                      <div className="flex items-start gap-4">
                        <div className="bg-red-100 dark:bg-red-950/50 p-2 rounded-full">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-base mb-1">{incident.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Started: {formatDate(incident.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Past Incidents */}
            <div>
              <h3 className="text-base font-semibold mb-4">Past Incidents</h3>
              {!data?.closedIncidents || data.closedIncidents.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border">
                  <p className="text-sm text-muted-foreground">No past incidents</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {data.closedIncidents.map((incident) => (
                    <div key={incident.id} className="flex flex-col border-b py-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-100 dark:bg-green-950/50 p-2 rounded-full">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-base mb-1">{incident.name}</p>
                          <div className="flex flex-col sm:flex-row sm:gap-4 text-xs text-muted-foreground">
                            <p>Started: {formatDate(incident.createdAt)}</p>
                            <p>Resolved: {incident.closedAt ? formatDate(incident.closedAt) : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {data?.organization?.name} Status Page
            </p>
            <p className="text-sm text-muted-foreground mt-2 sm:mt-0">
              Powered by StatusFly
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
