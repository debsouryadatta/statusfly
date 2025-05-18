import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Fetch user from the database with organization information
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return whether the user has an organization and the slug if they do
    return NextResponse.json({
      hasOrganization: !!user.organizationId,
      organizationSlug: user.organization?.slug || null,
      organizationId: user.organization?.id || null,
      organizationName: user.organization?.name || null
    });
  } catch (error) {
    console.error('Error checking organization:', error);
    return NextResponse.json(
      { error: 'Failed to check organization' },
      { status: 500 }
    );
  }
} 