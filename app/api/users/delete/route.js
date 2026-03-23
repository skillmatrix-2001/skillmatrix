import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Post from '@/lib/models/Post';

export async function DELETE(request) {
  try {
    await dbConnect();
    
    const { adminUserId, adminUserRole, targetUserId } = await request.json();

    if (!adminUserId || !adminUserRole || !targetUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify admin user exists and is actually an admin
    const adminUser = await User.findById(adminUserId);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admin users can delete accounts' },
        { status: 403 }
      );
    }

    // Find the target user to delete
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deleting themselves
    if (targetUser._id.toString() === adminUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete all posts by the user
    await Post.deleteMany({ owner: targetUserId });

    // Delete the user
    await User.findByIdAndDelete(targetUserId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUserId: targetUserId,
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete user',
        details: error.message 
      },
      { status: 500 }
    );
  }
}