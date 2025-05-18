import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Update service status
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { serviceId, status } = body;

    if (!serviceId || !status) {
      return NextResponse.json(
        { error: 'Service ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status - should be one of the valid statuses
    const validStatuses = ['Operational', 'Degraded Performance', 'Partial Outage', 'Major Outage'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
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

    // Find service and verify it belongs to the user's organization
    const service = await db.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    if (service.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this service' },
        { status: 403 }
      );
    }

    // Update the service status
    const updatedService = await db.service.update({
      where: { id: serviceId },
      data: { status }
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service status:', error);
    return NextResponse.json(
      { error: 'Failed to update service status' },
      { status: 500 }
    );
  }
} 