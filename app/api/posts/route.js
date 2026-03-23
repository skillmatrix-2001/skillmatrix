import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/lib/models/Post';
import User from '@/lib/models/User';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'certificate' or 'project'
    
    console.log('📋 GET /api/posts - userId:', userId, 'type:', type);
    
    // Build query
    const query = {};
    
    if (userId) {
      query.owner = userId;
    }
    
    if (type) {
      query.type = type;
    }
    
    // Get posts sorted by date (newest first)
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'owner',
        select: 'name registerNumber profile profilePic department batchYear',
        model: User
      });
    
    console.log(`✅ Found ${posts.length} posts`);
    
    return NextResponse.json({
      success: true,
      posts: posts
    });
    
  } catch (error) {
    console.error('❌ Get posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}