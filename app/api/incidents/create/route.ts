import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';

// POST a new incident for the organization
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  
    try {
      const body = await req.json();
      const { name } = body;
  
      if (!name) {
        return NextResponse.json(
          { error: 'Incident name is required' },
          { status: 400 }
        );
      }
  
      // Get user's organization
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      });
  
      if (!user || !user.organizationId) {
        return NextResponse.json(
          { error: 'User not found or not part of an organization' },
          { status: 404 }
        );
      }
  
      // Create the incident
      const incident = await db.incident.create({
        data: {
          name,
          organizationId: user.organizationId
        }
      });
  
      return NextResponse.json(incident);
    } catch (error) {
      console.error('Error creating incident:', error);
      return NextResponse.json(
        { error: 'Failed to create incident' },
        { status: 500 }
      );
    }
  } 