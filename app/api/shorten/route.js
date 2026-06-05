import dbConnect from '@/lib/mongodb';
import Url from '@/models/Url';
import { isValidUrl, generateShortCode } from '@/lib/utils';
import { NextResponse } from 'next/server';

/**
 * POST endpoint to create a shortened URL.
 * Expects a JSON body with { originalUrl }.
 */
export async function POST(request) {
  try {
    const { originalUrl } = await request.json();

    if (!originalUrl) {
      return NextResponse.json(
        { error: 'Original URL is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(originalUrl)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Must include http:// or https://' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate a unique code, checking for rare database collisions
    let shortCode = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      shortCode = generateShortCode();
      const existing = await Url.findOne({ shortCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate a unique short code after multiple attempts. Please try again.' },
        { status: 500 }
      );
    }

    // Create the DB record
    const newUrl = await Url.create({
      originalUrl,
      shortCode,
    });

    return NextResponse.json(newUrl, { status: 201 });
  } catch (error) {
    console.error('API Error in shorten:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch URLs.
 * If search query ?codes=code1,code2 is provided, fetches matching URLs.
 * Otherwise, returns the 10 most recent shortened URLs.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const codes = searchParams.get('codes');

    await dbConnect();

    if (codes) {
      const codeList = codes.split(',').filter(Boolean);
      const urls = await Url.find({ shortCode: { $in: codeList } }).sort({ createdAt: -1 });
      return NextResponse.json(urls);
    }

    // Default to the 10 most recent URLs
    const urls = await Url.find().sort({ createdAt: -1 }).limit(10);
    return NextResponse.json(urls);
  } catch (error) {
    console.error('API Error in GET shorten:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
