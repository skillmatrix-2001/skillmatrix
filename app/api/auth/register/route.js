import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { 
      registerNumber, 
      name,
      email,
      dob, 
      batchYear, 
      department, 
      password 
    } = await request.json();

    // Validate all required fields
    if (!registerNumber || !name || !email || !dob || !batchYear || !department || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate register number format (12 digits)
    if (!/^\d{12}$/.test(registerNumber)) {
      return NextResponse.json(
        { error: 'Register number must be exactly 12 digits' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate date of birth and age
    const birthDate = new Date(dob);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date of birth' },
        { status: 400 }
      );
    }
    
    // Check if date is not in the future
    if (birthDate > today) {
      return NextResponse.json(
        { error: 'Date of birth cannot be in the future' },
        { status: 400 }
      );
    }
    
    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Age validation: Must be at least 17 years old
    if (age < 17) {
      return NextResponse.json(
        { error: `You must be at least 17 years old to register. Your age: ${age} years` },
        { status: 400 }
      );
    }
    
    // Optional: Maximum age limit (60 years)
    if (age > 60) {
      return NextResponse.json(
        { error: `Age must be between 17 and 60 years. Your age: ${age} years` },
        { status: 400 }
      );
    }

    // Check if register number already exists
    const existingRegisterNumber = await User.findOne({ registerNumber });
    if (existingRegisterNumber) {
      return NextResponse.json(
        { error: 'Register number already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered. Please use a different email or login.' },
        { status: 409 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data
    const userData = {
      registerNumber: registerNumber.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      dob: birthDate,
      batchYear: parseInt(batchYear),
      department: department.trim(),
      password: hashedPassword,
      role: 'student',
      staffId: undefined,
      profile: {
        profilePic: '/placeholder.png',
        bio: '',
        interests: [],
        skills: [],
        experience: [],
        education: []
      }
    };

    console.log('💾 Creating user with data:', {
      ...userData,
      password: '[HIDDEN]',
      age: age
    });

    // Create and save user
    const user = new User(userData);
    await user.save({ validateBeforeSave: true });

    console.log(`✅ User created successfully: ${user._id} (Age: ${age} years)`);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: userResponse,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'registerNumber') {
        return NextResponse.json(
          { error: 'Register number already exists' },
          { status: 409 }
        );
      }
      if (field === 'email') {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Registration failed: ' + error.message },
      { status: 500 }
    );
  }
}