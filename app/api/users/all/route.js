import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get all users, exclude password field
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch users',
        users: [] // Return empty array on error
      },
      { status: 500 }
    );
  }
}