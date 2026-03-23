import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all users
    const users = await User.find({}).select('registerNumber name role department');
    
    console.log('📋 All users in database:', users);
    
    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        _id: user._id,
        registerNumber: user.registerNumber,
        name: user.name,
        role: user.role,
        department: user.department
      }))
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}