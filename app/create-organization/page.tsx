'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { PlusIcon, X, Loader2 } from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from '@/components/ModeToggle';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [checkingOrg, setCheckingOrg] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [demoServices, setDemoServices] = useState<string[]>(['']);
  const [teams, setTeams] = useState<string[]>(['']);

  useEffect(() => {
    const checkOrganization = async () => {
      if (isLoaded && userId) {
        try {
          const response = await axios.get("/api/check-organization");
          if (response.data.hasOrganization) {
            router.push(`/dashboard`);
            return;
          }
        } catch (error) {
          console.error("Error checking organization:", error);
        } finally {
          setCheckingOrg(false);
        }
      } else if (isLoaded && !userId) {
        setCheckingOrg(false);
      }
    };

    if (isLoaded) {
      checkOrganization();
    }
  }, [isLoaded, userId, router]);

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setOrgName(name);
    // Auto-generate slug from name (lowercase, replace spaces with hyphens)
    setOrgSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleServiceChange = (index: number, value: string) => {
    const updatedServices = [...demoServices];
    updatedServices[index] = value;
    setDemoServices(updatedServices);
  };

  const handleTeamChange = (index: number, value: string) => {
    const updatedTeams = [...teams];
    updatedTeams[index] = value;
    setTeams(updatedTeams);
  };

  const addService = () => {
    setDemoServices([...demoServices, '']);
  };

  const addTeam = () => {
    setTeams([...teams, '']);
  };

  const removeService = (index: number) => {
    if (demoServices.length > 1) {
      const updatedServices = demoServices.filter((_, i) => i !== index);
      setDemoServices(updatedServices);
    }
  };

  const removeTeam = (index: number) => {
    if (teams.length > 1) {
      const updatedTeams = teams.filter((_, i) => i !== index);
      setTeams(updatedTeams);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!orgName || !orgSlug) {
      toast.error('Organization name and slug are required');
      return;
    }
    
    // Filter out empty service and team names
    const filteredServices = demoServices.filter(service => service.trim() !== '');
    const filteredTeams = teams.filter(team => team.trim() !== '');
    
    if (filteredServices.length === 0) {
      toast.error('At least one service is required');
      return;
    }
    
    if (filteredTeams.length === 0) {
      toast.error('At least one team is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/create-organization', {
        name: orgName,
        slug: orgSlug,
        userId,
        services: filteredServices.map(name => ({
          name,
          status: 'Operational' // Default status for demo services
        })),
        teams: filteredTeams.map(name => ({ name }))
      });
      
      toast.success('Organization created successfully!');
      
      // Redirect to the organization dashboard
      router.push(`/dashboard`);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create organization';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingOrg) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
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
    <>
      {/* Header */}
      <div className="fixed top-0 right-0 p-4 flex items-center gap-3 z-10">
        <ModeToggle />
        <UserButton />
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] w-full">
        <Card className="w-full max-w-2xl border-0 shadow mx-4">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold">Create Organization</CardTitle>
            <CardDescription>
              Set up your organization with services and teams
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Organization Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="org-name" className="text-sm font-medium">
                      Organization Name
                    </Label>
                    <Input
                      id="org-name"
                      placeholder="Enter organization name"
                      value={orgName}
                      onChange={handleOrgNameChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-slug" className="text-sm font-medium">
                      Organization Slug
                    </Label>
                    <div className="flex items-center mt-1">
                      <Input
                        id="org-slug"
                        placeholder="organization-slug"
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be used in URLs and cannot be changed later
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <Input value="Owner" disabled className="mt-1 bg-muted/50" />
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                {/* Demo Services */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Demo Services</Label>
                  
                  <div className="space-y-2">
                    {demoServices.map((service, index) => (
                      <div key={`service-${index}`} className="flex items-center gap-2">
                        <Input
                          placeholder="Enter service name"
                          value={service}
                          onChange={(e) => handleServiceChange(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(index)}
                          disabled={demoServices.length <= 1}
                          className="h-9 w-9 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                      className="w-full mt-1 text-sm h-9"
                      size="sm"
                    >
                      <PlusIcon className="h-3.5 w-3.5 mr-1" />
                      Add Service
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                {/* Teams */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Teams</Label>
                  
                  <div className="space-y-2">
                    {teams.map((team, index) => (
                      <div key={`team-${index}`} className="flex items-center gap-2">
                        <Input
                          placeholder="Enter team name"
                          value={team}
                          onChange={(e) => handleTeamChange(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeam(index)}
                          disabled={teams.length <= 1}
                          className="h-9 w-9 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTeam}
                      className="w-full mt-1 text-sm h-9"
                      size="sm"
                    >
                      <PlusIcon className="h-3.5 w-3.5 mr-1" />
                      Add Team
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 mb-2">
                <Button 
                  type="submit" 
                  className="w-full py-5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Organization...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
