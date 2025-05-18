'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Bell, 
  Plus, 
  X, 
  ChevronDown, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ModeToggle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Import Prisma types
import { 
  User, 
  Service, 
  Incident 
} from '@/lib/generated/prisma'

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [organizationDetails, setOrganizationDetails] = useState<{
    name: string | null;
    slug: string | null;
    id: string | null;
  }>({ name: null, slug: null, id: null });
  const [services, setServices] = useState<Service[]>([]);
  const [openIncidents, setOpenIncidents] = useState<Incident[]>([]);
  const [closedIncidents, setClosedIncidents] = useState<Incident[]>([]);
  
  const [showCreateIncidentDialog, setShowCreateIncidentDialog] = useState(false);
  const [showCreateServiceDialog, setShowCreateServiceDialog] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newIncidentName, setNewIncidentName] = useState('');
  const [isCreatingIncident, setIsCreatingIncident] = useState(false);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isClosingIncident, setIsClosingIncident] = useState<{[key: string]: boolean}>({});

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
        return null;
    }
  };

  // Load data when the page loads
  useEffect(() => {
    const fetchData = async () => {
      if (isLoaded && userId) {
        try {
          // Get user details
          const userResponse = await axios.get('/api/user-details');
          setUser(userResponse.data);
          
          // Get organization details
          const orgResponse = await axios.get('/api/check-organization');
          setOrganizationDetails({
            name: orgResponse.data.organizationName,
            slug: orgResponse.data.organizationSlug,
            id: orgResponse.data.organizationId
          });

          // Load services
          const servicesResponse = await axios.get('/api/services');
          setServices(servicesResponse.data);
          console.log("Services: ", servicesResponse.data);
          

          // Load incidents
          const incidentsResponse = await axios.get('/api/incidents');
          setOpenIncidents(incidentsResponse.data.openIncidents);
          setClosedIncidents(incidentsResponse.data.closedIncidents);

          setIsLoading(false);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          toast.error('Failed to load dashboard data');
          setIsLoading(false);
        }
      } else if (isLoaded && !userId) {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, userId, router]);

  // Update service status
  const handleStatusChange = async (serviceId: string, status: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await axios.patch('/api/services/status', {
        serviceId,
        status
      });

      // Update the services list with the updated service
      const updatedServices = services.map(service =>
        service.id === serviceId ? { ...service, status } : service
      );
      setServices(updatedServices);
      
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('Failed to update service status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Create new service
  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      toast.error('Service name is required');
      return;
    }

    setIsCreatingService(true);
    try {
      const response = await axios.post('/api/services/create', {
        name: newServiceName
      });

      // Add the new service to the services list
      setServices(prev => [...prev, response.data]);
      
      // Reset form
      setNewServiceName('');
      setShowCreateServiceDialog(false);
      
      toast.success('Service created successfully');
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Failed to create service');
    } finally {
      setIsCreatingService(false);
    }
  };

  // Create new incident
  const handleCreateIncident = async () => {
    if (!newIncidentName.trim()) {
      toast.error('Incident name is required');
      return;
    }

    setIsCreatingIncident(true);
    try {
      const response = await axios.post('/api/incidents/create', {
        name: newIncidentName
      });

      // Add the new incident to the open incidents list
      setOpenIncidents(prev => [response.data, ...prev]);
      
      // Reset form
      setNewIncidentName('');
      setShowCreateIncidentDialog(false);
      
      toast.success('Incident created successfully');
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Failed to create incident');
    } finally {
      setIsCreatingIncident(false);
    }
  };

  // Close an incident
  const handleCloseIncident = async (incidentId: string) => {
    setIsClosingIncident(prev => ({ ...prev, [incidentId]: true }));
    
    try {
      const response = await axios.patch('/api/incidents/close', {
        incidentId
      });

      // Remove from open incidents and add to closed incidents
      const closedIncident = openIncidents.find(incident => incident.id === incidentId);
      if (closedIncident) {
        setOpenIncidents(prev => prev.filter(incident => incident.id !== incidentId));
        // Use the response data which will have the proper Date format
        setClosedIncidents(prev => [response.data, ...prev]);
      }
      
      toast.success('Incident closed successfully');
    } catch (error) {
      console.error('Error closing incident:', error);
      toast.error('Failed to close incident');
    } finally {
      setIsClosingIncident(prev => ({ ...prev, [incidentId]: false }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4 mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isLoaded && !userId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-xl font-semibold">You are not signed in</div>
        <Button onClick={() => router.push("/")}>Back to Landing Page</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-4 flex h-16 items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Profile & Organization Info */}
        <Card>
                      <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">Profile</CardTitle>
              <CardDescription className="mt-1.5">
                Your profile and organization details
              </CardDescription>
            </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-muted/20 p-5 rounded-lg border">
                <h3 className="text-base font-medium mb-4">User Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Role</p>
                    <p className="font-medium capitalize">{user?.role || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/20 p-5 rounded-lg border">
                <h3 className="text-base font-medium mb-4">Organization</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{organizationDetails.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Slug</p>
                    <p className="font-medium">{organizationDetails.slug || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ID</p>
                    <p className="font-medium text-xs text-muted-foreground truncate">{organizationDetails.id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Services</CardTitle>
              <CardDescription className="mt-1.5">
                Manage and update the status of your services
              </CardDescription>
            </div>
            <Dialog open={showCreateServiceDialog} onOpenChange={setShowCreateServiceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Service</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">Service Name</Label>
                    <Input
                      id="service-name"
                      placeholder="Enter service name"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateService} 
                    className="w-full"
                    disabled={isCreatingService}
                  >
                    {isCreatingService ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Service'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="text-center py-10 bg-muted/20 rounded-lg border">
                <div className="bg-primary/10 mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground mb-4">No services added yet</p>
                <Button variant="default" className="mt-2" onClick={() => setShowCreateServiceDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border hover:border-primary/20 hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex flex-col w-full">
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
                    <Select
                      defaultValue={service.status}
                      onValueChange={(value) => handleStatusChange(service.id, value)}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="w-full sm:w-[220px] mt-3 sm:mt-0">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operational">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Operational
                          </div>
                        </SelectItem>
                        <SelectItem value="Degraded Performance">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                            Degraded Performance
                          </div>
                        </SelectItem>
                        <SelectItem value="Partial Outage">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            Partial Outage
                          </div>
                        </SelectItem>
                        <SelectItem value="Major Outage">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Major Outage
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Incidents</CardTitle>
              <CardDescription className="mt-1.5">
                Manage and track incidents for your services
              </CardDescription>
            </div>
            <Dialog open={showCreateIncidentDialog} onOpenChange={setShowCreateIncidentDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Incident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Incident</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="incident-name">Incident Name</Label>
                    <Input
                      id="incident-name"
                      placeholder="Describe the incident"
                      value={newIncidentName}
                      onChange={(e) => setNewIncidentName(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateIncident} 
                    className="w-full"
                    disabled={isCreatingIncident}
                  >
                    {isCreatingIncident ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Incident'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-4">Current Incidents</h3>
              {openIncidents.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No current incidents - all systems operational</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openIncidents.map((incident) => (
                    <div key={incident.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-lg border border-red-200 dark:border-red-900 bg-muted/30 gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="bg-red-100 dark:bg-red-950/50 p-2 rounded-full">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-base mb-1">{incident.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(incident.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="sm:ml-auto"
                        onClick={() => handleCloseIncident(incident.id)}
                        disabled={isClosingIncident[incident.id]}
                      >
                        {isClosingIncident[incident.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1.5" />
                            Close Incident
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-base font-semibold mb-4">Past Incidents</h3>
              {closedIncidents.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border">
                  <p className="text-sm text-muted-foreground">No past incidents</p>
                </div>
              ) : (
                              <div className="space-y-3">
                  {closedIncidents.slice(0, 5).map((incident) => (
                    <div key={incident.id} className="flex items-start md:items-center gap-4 p-4 rounded-lg border hover:bg-muted/20 transition-colors">
                      <div className="bg-green-100 dark:bg-green-950/50 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-base mb-1">{incident.name}</p>
                        <div className="flex flex-col sm:flex-row sm:gap-4 text-xs text-muted-foreground">
                          <p>Started: {new Date(incident.createdAt).toLocaleString()}</p>
                          <p>Resolved: {incident.closedAt ? new Date(incident.closedAt).toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {closedIncidents.length > 5 && (
                    <Button variant="outline" className="w-full mt-2 bg-muted/20">
                      View All Past Incidents
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
