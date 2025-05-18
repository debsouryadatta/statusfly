import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';

// GET all services for the organization of the current user
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

    // Get services for the organization
    const services = await db.service.findMany({
      where: { organizationId: user.organizationId }
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
