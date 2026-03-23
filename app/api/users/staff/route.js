import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get all staff users
    const staff = await User.find({ role: 'staff' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      staff,
      count: staff.length,
    });

  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch staff',
        staff: []
      },
      { status: 500 }
    );
  }
}