import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  console.log('=== CREATE STAFF API CALLED ===');
  
  try {
    await dbConnect();
    console.log('✅ DB connected');
    
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    const { name, department, staffId, password } = body;

    // Basic validation
    if (!name || !department || !staffId || !password) {
      console.log('❌ Missing fields:', { name, department, staffId, hasPassword: !!password });
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Trim and normalize
    const normalizedStaffId = staffId.trim().toUpperCase();
    console.log('🔤 Normalized staffId:', normalizedStaffId);

    if (!normalizedStaffId) {
      console.log('❌ Invalid staff ID after normalization');
      return NextResponse.json(
        { error: 'Invalid staff ID' },
        { status: 400 }
      );
    }

    // Check if staffId exists (CASE-INSENSITIVE)
    const existingStaff = await User.findOne({
      $or: [
        { staffId: { $regex: new RegExp(`^${normalizedStaffId}$`, 'i') } },
        { registerNumber: { $regex: new RegExp(`^${normalizedStaffId}$`, 'i') } }
      ]
    });

    console.log('🔍 Existing staff check result:', existingStaff ? 'FOUND' : 'NOT FOUND');
    if (existingStaff) {
      console.log('📝 Existing user:', {
        _id: existingStaff._id,
        name: existingStaff.name,
        staffId: existingStaff.staffId,
        registerNumber: existingStaff.registerNumber,
        role: existingStaff.role
      });
    }

    if (existingStaff) {
      return NextResponse.json(
        { error: `ID "${normalizedStaffId}" already exists` },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff user
    const staffUser = new User({
      staffId: normalizedStaffId,
      name: name.trim(),
      department: department.trim(),
      password: hashedPassword,
      role: 'staff',
      profile: {
        profilePic: '/placeholder.png',
        bio: `${department} Faculty`,
        interests: [],
      },
    });

    console.log('📝 Attempting to save staff user...');
    await staffUser.save();
    console.log('✅ Staff saved successfully:', staffUser._id);

    // Remove password from response
    const userResponse = staffUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
      {
        message: 'Staff account created successfully',
        user: userResponse,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ CREATE STAFF ERROR:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));

    // Duplicate key error (DB-level safety net)
    if (error.code === 11000) {
      console.error('💥 DUPLICATE KEY ERROR - MongoDB rejected the insert');
      return NextResponse.json(
        { error: 'Database rejected: Staff ID already exists (duplicate key)' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create staff: ' + error.message },
      { status: 500 }
    );
  }
}