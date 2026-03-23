import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { identifier, password, role } = await request.json();

    if (!identifier || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find user based on role and identifier
    let user;
    if (role === 'student') {
      user = await User.findOne({ 
        registerNumber: identifier,
        role: 'student' 
      });
    } else if (role === 'staff') {
      user = await User.findOne({ 
        staffId: identifier,
        role: 'staff' 
      });
    } else if (role === 'admin') {
      user = await User.findOne({ 
        $or: [
          { registerNumber: identifier },
          { staffId: identifier }
        ],
        role: 'admin' 
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Generate a simple token (base64 of userId:timestamp)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}