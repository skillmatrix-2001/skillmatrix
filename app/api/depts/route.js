import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Dept from '@/lib/models/Dept';

export async function GET(request) {
  try {
    await dbConnect();
    
    const departments = await Dept.find().sort({ name: 1 });

    return NextResponse.json(departments);

  } catch (error) {
    console.error('Get departments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const { userId, userRole, name, color } = await request.json(); // In real app, get userId and role from auth token

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is admin (in real app, check token)
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admin users can create departments' },
        { status: 403 }
      );
    }

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Department name and color are required' },
        { status: 400 }
      );
    }

    // Check if department already exists
    const existingDept = await Dept.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingDept) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 409 }
      );
    }

    // Validate color format
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (!colorRegex.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a valid hex color (e.g., #10b981)' },
        { status: 400 }
      );
    }

    // Create new department
    const department = await Dept.create({
      name: name.trim(),
      color,
    });

    return NextResponse.json({
      message: 'Department created successfully',
      department,
    }, { status: 201 });

  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint for departments
export async function DELETE(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const deptId = searchParams.get('id');
    const userId = searchParams.get('userId'); // In real app, get from auth token
    const userRole = searchParams.get('role'); // In real app, get from auth token

    if (!deptId || !userId || !userRole) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify user is admin (in real app, check token)
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admin users can delete departments' },
        { status: 403 }
      );
    }

    // Find the department
    const department = await Dept.findById(deptId);
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if any users are assigned to this department
    // In a real app, you would check User model
    // For now, we'll just delete
    await Dept.findByIdAndDelete(deptId);

    return NextResponse.json({
      message: 'Department deleted successfully',
      department,
    });

  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}