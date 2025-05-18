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
    const { name, slug, teamName } = body;
    
    // Validate request data
    if (!name || !slug) {
      return NextResponse.json(
        { message: 'Organization name and slug are required' },
        { status: 400 }
      );
    }
    
    if (!teamName) {
      return NextResponse.json(
        { message: 'Team name is required' },
        { status: 400 }
      );
    }
    
    // Check if the user is already a member of any organization
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true }
    });
    
    if (existingUser?.organizationId) {
      return NextResponse.json(
        { message: 'You are already a member of an organization' },
        { status: 400 }
      );
    }
    
    // Check if the organization exists
    const organization = await db.organization.findFirst({
      where: {
        AND: [
          { name },
          { slug }
        ]
      },
      include: {
        teams: true
      }
    });
    
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found. Please check the name and slug.' },
        { status: 404 }
      );
    }
    
    // Check if the team exists within the organization
    const team = organization.teams.find(team => team.name === teamName);
    
    if (!team) {
      return NextResponse.json(
        { message: `Team "${teamName}" not found in this organization` },
        { status: 404 }
      );
    }
    
    // Update the user to join the organization and team as a member
    await db.user.update({
      where: {
        id: userId
      },
      data: {
        organizationId: organization.id,
        teamId: team.id,
        role: 'member'
      }
    });
    
    return NextResponse.json({
      message: 'Successfully joined the organization',
      slug: organization.slug,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      team: {
        id: team.id,
        name: team.name
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error joining organization:', error);
    return NextResponse.json(
      { message: 'Failed to join organization', error: (error as Error).message },
      { status: 500 }
    );
  }
} 