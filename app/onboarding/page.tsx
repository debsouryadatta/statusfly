"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ModeToggle";
import type { User } from "@/lib/generated/prisma";

export default function OnboardingPage() {
  const { isLoaded, userId, isSignedIn } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (isSignedIn && userId) {
        try {
          // Check if user is already part of an organization
          const orgResponse = await axios.get("/api/check-organization");
          
          if (orgResponse.data.hasOrganization) {
            router.push(`/dashboard`);
            return;
          }
          
          // Fetch user data if not part of an organization
          const userResponse = await axios.get("/api/user-details");
          setUserData(userResponse.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      } else if (isLoaded && !isSignedIn) {
        router.push("/");
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, userId, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (isLoaded && !isSignedIn) {
    return (
      <>
        {/* Header */}
        <div className="fixed top-0 right-0 p-4 flex items-center gap-3 z-10">
          <ModeToggle />
        </div>
        
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <div className="text-xl font-semibold">You are not signed in</div>
          <Button onClick={() => router.push("/")}>Back to Landing Page</Button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="fixed top-0 right-0 p-4 flex items-center gap-3 z-10">
        <ModeToggle />
        <UserButton />
      </div>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-center text-3xl font-bold">Welcome</h1>

          <Card className="border">
            <CardContent className="p-6">
              <div className="mb-6 space-y-4">
                <div>
                  <Label className="mb-1 block font-medium">Name</Label>
                  <p className="text-lg">{userData?.name}</p>
                </div>

                <div>
                  <Label className="mb-1 block font-medium">Email</Label>
                  <p className="text-lg">{userData?.email}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <Button onClick={() => router.push("/create-organization")} className="w-full py-6 text-lg cursor-pointer">
                  Create organization
                </Button>

                <Button
                  onClick={() => router.push("/join-organization")}
                  variant="outline"
                  className="w-full py-6 text-lg cursor-pointer"
                >
                  Join organization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
