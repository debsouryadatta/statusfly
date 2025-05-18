import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';

// GET all incidents for the organization of the current user
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get user and their organization
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

    // Get incidents for the organization, ordered by most recent first
    const incidents = await db.incident.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    // Separate open and closed incidents
    const openIncidents = incidents.filter(incident => !incident.closedAt);
    const closedIncidents = incidents.filter(incident => incident.closedAt);

    return NextResponse.json({
      openIncidents,
      closedIncidents
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
