import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/lib/models/Post';

export async function DELETE(request, { params }) {
  console.log('🗑️ DELETE post called');
  
  try {
    await dbConnect();
    
    const { id } = await params;
    console.log('Deleting post ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID required' },
        { status: 400 }
      );
    }
    
    // Delete the post
    const deletedPost = await Post.findByIdAndDelete(id);
    
    if (!deletedPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Post deleted:', id);
    
    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// GET single post
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const post = await Post.findById(id)
      .populate('owner', 'name registerNumber profile.profilePic');
    
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      post: post
    });
    
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}