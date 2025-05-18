import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Close an incident
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { incidentId } = body;

    if (!incidentId) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'User not found or not part of an organization' },
        { status: 404 }
      );
    }

    // Find incident and verify it belongs to the user's organization
    const incident = await db.incident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    if (incident.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this incident' },
        { status: 403 }
      );
    }

    // Check if incident is already closed
    if (incident.closedAt) {
      return NextResponse.json(
        { error: 'Incident is already closed' },
        { status: 400 }
      );
    }

    // Close the incident by setting closedAt to current time
    const updatedIncident = await db.incident.update({
      where: { id: incidentId },
      data: { closedAt: new Date() }
    });

    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error('Error closing incident:', error);
    return NextResponse.json(
      { error: 'Failed to close incident' },
      { status: 500 }
    );
  }
} 