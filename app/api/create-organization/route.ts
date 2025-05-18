import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { name, slug, services, teams } = body;
    
    // Validate request data
    if (!name || !slug) {
      return NextResponse.json(
        { message: 'Organization name and slug are required' },
        { status: 400 }
      );
    }
    
    if (!services || !services.length) {
      return NextResponse.json(
        { message: 'At least one service is required' },
        { status: 400 }
      );
    }
    
    if (!teams || !teams.length) {
      return NextResponse.json(
        { message: 'At least one team is required' },
        { status: 400 }
      );
    }
    
    // Check if slug is already taken
    const existingOrg = await db.organization.findUnique({
      where: { slug },
    });
    
    if (existingOrg) {
      return NextResponse.json(
        { message: 'Organization slug is already taken' },
        { status: 400 }
      );
    }
    
    // Create the organization using Prisma transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create the organization
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
        },
      });
      
      // 2. Update the user with organization ID and owner role
      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          organizationId: organization.id,
          role: 'owner',
        },
      });
      
      // 3. Create the teams
      const createdTeams = await Promise.all(
        teams.map(async (team: { name: string }) => {
          return tx.team.create({
            data: {
              name: team.name,
              organizationId: organization.id,
            },
          });
        })
      );
      
      // 4. Create the services
      const createdServices = await Promise.all(
        services.map(async (service: { name: string; status: string }) => {
          return tx.service.create({
            data: {
              name: service.name,
              status: service.status,
              organizationId: organization.id,
            },
          });
        })
      );
      
      return {
        organization,
        teams: createdTeams,
        services: createdServices,
      };
    });
    
    return NextResponse.json({
      message: 'Organization created successfully',
      slug: result.organization.slug,
      id: result.organization.id,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { message: 'Failed to create organization', error: (error as Error).message },
      { status: 500 }
    );
  }
} 