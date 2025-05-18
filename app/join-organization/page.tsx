'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModeToggle } from '@/components/ModeToggle';

export default function JoinOrganizationPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [checkingOrg, setCheckingOrg] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [teamName, setTeamName] = useState('');

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
    setOrgName(e.target.value);
  };

  const handleOrgSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!orgName || !orgSlug) {
      toast.error('Organization name and slug are required');
      return;
    }
    
    if (!teamName) {
      toast.error('Please select a team to join');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/join-organization', {
        name: orgName,
        slug: orgSlug,
        teamName,
        userId,
      });
      
      toast.success('Successfully joined the organization!');
      
      // Redirect to the organization dashboard
      router.push(`/dashboard`);
    } catch (error: any) {
      console.error('Error joining organization:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join organization';
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
        <Card className="w-full max-w-md border-0 shadow mx-4">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold">Join Organization</CardTitle>
            <CardDescription>
              Join an existing organization as a team member
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
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
                      onChange={handleOrgSlugChange}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    The unique identifier for the organization
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="team-name" className="text-sm font-medium">
                    Team
                  </Label>
                  <Input
                    id="team-name"
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The exact name of the team you want to join
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Input value="Team Member" disabled className="mt-1 bg-muted/50" />
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
                      Joining Organization...
                    </>
                  ) : (
                    'Join Organization'
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
