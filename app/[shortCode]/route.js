import dbConnect from '@/lib/mongodb';
import Url from '@/models/Url';
import { NextResponse } from 'next/server';

/**
 * Dynamic GET route to handle shortened URL redirection.
 * Extracts the shortCode, increments clicks atomically, and redirects.
 */
export async function GET(request, { params }) {
  // Await params to support both Next.js 14 and Next.js 15+ App Router
  const resolvedParams = await params;
  const shortCode = resolvedParams?.shortCode;

  if (!shortCode) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    await dbConnect();

    // Find and atomically increment clicks
    const urlDoc = await Url.findOneAndUpdate(
      { shortCode },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!urlDoc) {
      // If code is not found, redirect to home page with a query param
      return NextResponse.redirect(new URL(`/?error=not-found&code=${shortCode}`, request.url));
    }

    // Redirect to original URL
    return NextResponse.redirect(urlDoc.originalUrl);
  } catch (error) {
    console.error('Redirect handler error:', error);
    return NextResponse.redirect(new URL('/?error=server-error', request.url));
  }
}
