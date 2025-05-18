import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';

// POST - Create a new service
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
        { error: 'Service name is required' },
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

    // Create the service with initial status of "Operational"
    const service = await db.service.create({
      data: {
        name,
        status: 'Operational',
        organizationId: user.organizationId
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
} 