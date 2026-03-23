import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    
    console.log('📋 GET /api/users/students - Fetching all students');
    
    // Get all students (role = 'student')
    const students = await User.find({ role: 'student' })
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Found ${students.length} students`);
    
    return NextResponse.json({
      success: true,
      students: students
    });
    
  } catch (error) {
    console.error('❌ Get students error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}