import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/lib/models/Post';
import User from '@/lib/models/User';

export async function DELETE(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const userId = searchParams.get('userId'); // In real app, get from auth token
    const userRole = searchParams.get('role'); // In real app, get from auth token

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // In a real app, you would:
    // 1. Verify authentication token
    // 2. Get user info from token
    // 3. Check if user is admin or post owner
    
    // For now, we'll accept userId and role from request (simplified)
    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or post owner
    const isAdmin = userRole === 'admin';
    const isOwner = post.owner.toString() === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admin or post owner can delete posts' },
        { status: 403 }
      );
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    return NextResponse.json({
      message: 'Post deleted successfully',
    });

  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to verify ownership before deletion
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Post ID and User ID are required' },
        { status: 400 }
      );
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const isOwner = post.owner.toString() === userId;

    return NextResponse.json({
      canDelete: isOwner,
      postOwner: post.owner,
      requestedUser: userId,
    });

  } catch (error) {
    console.error('Check ownership error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}