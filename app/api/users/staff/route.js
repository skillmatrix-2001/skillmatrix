import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request) {
  try {
    await dbConnect();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no token in header, try cookie
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => {
            const [key, val] = c.split('=');
            return [key, decodeURIComponent(val)];
          })
        );
        token = cookies.token;
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Decode token (simple base64 encoding: userId:timestamp)
    let userId;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      userId = decoded.split(':')[0];
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Verify the requesting user is staff
    const requestingUser = await User.findById(userId).select('department role');
    if (!requestingUser || requestingUser.role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get department filter from query (default to same department)
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || requestingUser.department;

    // Fetch staff from the same department
    const staff = await User.find({
      role: 'staff',
      department: department
    })
    .select('-password')
    .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      staff,
      count: staff.length
    });

  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', staff: [] },
      { status: 500 }
    );
  }
}