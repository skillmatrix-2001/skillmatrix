// app/api/posts/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/lib/models/Post';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==================== DELETE ====================
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

    // Optional: Delete images from Cloudinary
    if (deletedPost.media && deletedPost.media.length) {
      for (const mediaItem of deletedPost.media) {
        if (mediaItem.cloudinaryId) {
          try {
            await cloudinary.uploader.destroy(mediaItem.cloudinaryId);
          } catch (err) {
            console.error('Cloudinary delete failed:', err);
          }
        }
      }
    }

    console.log('✅ Post deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// ==================== GET single post ====================
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    const post = await Post.findById(id).populate(
      'owner',
      'name registerNumber profile.profilePic'
    );

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post: post,
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// ==================== PUT (update post) ====================
export async function PUT(request, { params }) {
  console.log('✏️ PUT post called');

  try {
    await dbConnect();

    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get('title');
    const description = formData.get('description');
    const tags = formData.get('tags') || '';
    const techStack = formData.get('techStack') || '';
    const issuedBy = formData.get('issuedBy') || '';
    const semester = formData.get('semester');
    const fromDate = formData.get('fromDate');     // 👈 ADD
    const toDate = formData.get('toDate');         // 👈 ADD
    const files = formData.getAll('files'); // new images (optional)

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Update text fields
    post.title = title;
    post.description = description;
    if (semester && !isNaN(parseInt(semester))) {
      const sem = parseInt(semester);
      if (sem >= 1 && sem <= 8) post.semester = sem;
    }

    if (post.type === 'certificate') {
      post.issuedBy = issuedBy || 'Self';
      post.tags = tags.split(',').map(t => t.trim()).filter(Boolean);

      // 👇 NEW: Update participation date
      if (fromDate) {
        post.participationDate = post.participationDate || {};
        post.participationDate.from = new Date(fromDate);
        post.participationDate.to = toDate ? new Date(toDate) : undefined;
      }
      // (If no fromDate is sent, keep existing date; do not clear)
    } else if (post.type === 'project') {
      post.techStack = techStack.split(',').map(t => t.trim()).filter(Boolean);
      post.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Handle media update: if new files are provided, replace all existing media
    if (files && files.length > 0) {
      // Delete old images from Cloudinary
      if (post.media && post.media.length) {
        for (const mediaItem of post.media) {
          if (mediaItem.cloudinaryId) {
            try {
              await cloudinary.uploader.destroy(mediaItem.cloudinaryId);
            } catch (err) {
              console.error('Cloudinary delete failed:', err);
            }
          }
        }
      }

      // Upload new files
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024;
      const newMedia = [];

      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { success: false, error: `Invalid file type: ${file.name}. Only JPEG, PNG, GIF, WebP allowed.` },
            { status: 400 }
          );
        }
        if (file.size > maxSize) {
          return NextResponse.json(
            { success: false, error: `File ${file.name} too large. Maximum size is 5MB.` },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'skillmatrix', resource_type: 'image' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        newMedia.push({
          url: uploadResult.secure_url,
          type: 'image',
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          cloudinaryId: uploadResult.public_id,
        });
      }

      post.media = newMedia;
    }

    post.updatedAt = new Date();
    await post.save();

    // Populate owner for response
    const updatedPost = await Post.findById(post._id).populate(
      'owner',
      'name registerNumber profile.profilePic'
    );

    return NextResponse.json({
      success: true,
      message: 'Post updated',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { success: false, error: 'Update failed', details: error.message },
      { status: 500 }
    );
  }
}