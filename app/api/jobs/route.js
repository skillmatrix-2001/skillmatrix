import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'software developer fresher india';

  try {
    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1&country=in&date_posted=week`,
      {
        headers: {
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          'x-rapidapi-key': process.env.JSEARCH_API_KEY,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json({ success: true, jobs: data.data || [] });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ success: false, error: 'Network error' }, { status: 500 });
  }
}