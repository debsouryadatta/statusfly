import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: 'Organization slug is required' },
      { status: 400 }
    );
  }

  try {
    // Find organization by slug
    const organization = await db.organization.findUnique({
      where: { slug }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get services for the organization
    const services = await db.service.findMany({
      where: { organizationId: organization.id }
    });

    // Get incidents for the organization, ordered by most recent first
    const incidents = await db.incident.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: 'desc' }
    });

    // Separate open and closed incidents
    const openIncidents = incidents.filter(incident => !incident.closedAt);
    const closedIncidents = incidents.filter(incident => incident.closedAt);

    return NextResponse.json({
      organization,
      services,
      openIncidents,
      closedIncidents
    });
  } catch (error) {
    console.error('Error fetching organization data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization data' },
      { status: 500 }
    );
  }
} 