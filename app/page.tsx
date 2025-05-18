// app/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/ModeToggle";
import { SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { Organization } from '@/lib/generated/prisma';

export default function LandingPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isLoaded && user) {
          window.location.href = "/onboarding";
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    };

    const fetchOrganizations = async () => {
      try {
        const response = await axios.get('/api/public/organizations');
        setOrganizations(response.data);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to load organizations');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchOrganizations();
  }, [isLoaded, user]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30">
        <div className="container px-4 md:px-6 mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-xl font-bold">StatusFly</span>
          </div>
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton>
                <Button variant="ghost" size="sm">Log in</Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">Sign up</Button>
              </SignUpButton>
            </SignedOut>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Know when your services are down before your users do</h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Beautiful, real-time status pages for your services. Monitor, update, and communicate service status effortlessly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <SignedOut>
                <SignUpButton>
                  <Button size="lg">Get Started</Button>
                </SignUpButton>
                <SignInButton>
                  <Button variant="outline" size="lg">Log In</Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </section>

        {/* Organizations Status Section */}
        <section className="py-20 bg-gradient-to-b from-blue-50/50 via-muted/20 to-background dark:from-blue-950/10 dark:via-blue-900/5 dark:to-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Status Pages</h2>
              <p className="text-muted-foreground max-w-2xl">Status pages of various organizations</p>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-70" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16 max-w-md mx-auto">
                <Card className="w-full border-destructive/40">
                  <CardContent className="pt-6">
                    <div className="text-destructive text-center">{error}</div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {organizations.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <p className="text-muted-foreground text-lg">No organizations available at this time</p>
                    <p className="text-sm mt-2">Check back later for updates</p>
                  </div>
                ) : (
                  organizations.map((org) => (
                    <Link href={`/status/${org.slug}`} key={org.id} className="group">
                      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/60 bg-card/80 backdrop-blur dark:bg-card/40 dark:hover:bg-card/60">
                        <div className="absolute h-1 w-full top-0 left-0 bg-gradient-to-r from-primary/40 to-primary/80 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <div className="h-5 w-5 rounded-full bg-green-500 mr-2.5 flex-shrink-0"></div>
                            {org.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Operational</span>
                            <span className="text-primary/70 font-medium group-hover:text-primary transition-colors">
                              View Details →
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-sm font-medium">StatusFly</span>
          </div>
          <div className="flex gap-4">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Contact</Link>
          </div>
          <div className="text-xs text-muted-foreground">
            © 2025 StatusFly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
