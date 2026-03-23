import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/lib/models/Post';
import User from '@/lib/models/User';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  console.log('📤 POST /api/posts/upload called');

  try {
    await dbConnect();
    console.log('✅ Database connected');

    const formData = await request.formData();

    const title = formData.get('title');
    const description = formData.get('description');
    const type = formData.get('type');
    const userId = formData.get('userId');
    const tags = formData.get('tags') || '';
    const techStack = formData.get('techStack') || '';
    const issuedBy = formData.get('issuedBy') || '';
    const semester = formData.get('semester');
    const file = formData.get('file');

    console.log('📝 Upload data received:', {
      title, type, userId, semester,
      descriptionLength: description?.length,
      hasFile: !!file, fileName: file?.name, fileSize: file?.size
    });

    if (!title || !description || !type || !userId || !file) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, GIF, WebP allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
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

    const fileUrl = uploadResult.secure_url;
    console.log('✅ Cloudinary upload successful:', fileUrl);

    const media = [{
      url: fileUrl,
      type: 'image',
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      cloudinaryId: uploadResult.public_id
    }];

    const postData = {
      owner: userId,
      type,
      title,
      description,
      media,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (semester && !isNaN(parseInt(semester))) {
      const sem = parseInt(semester);
      if (sem >= 1 && sem <= 8) {
        postData.semester = sem;
      }
    }

    if (type === 'certificate') {
      postData.issuedBy = issuedBy || 'Self';
      if (tags) {
        postData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    } else if (type === 'project') {
      if (techStack) {
        postData.techStack = techStack.split(',').map(tech => tech.trim()).filter(tech => tech);
      }
      if (tags) {
        postData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    console.log('💾 Saving post to database...');
    const post = new Post(postData);
    await post.save();

    console.log('✅ Post created with ID:', post._id);

    return NextResponse.json({
      success: true,
      message: 'Upload successful',
      post: {
        _id: post._id,
        title: post.title,
        description: post.description,
        type: post.type,
        semester: post.semester,
        media: post.media,
        issuedBy: post.issuedBy,
        tags: post.tags || [],
        techStack: post.techStack || [],
        createdAt: post.createdAt,
        owner: {
          _id: user._id,
          name: user.name,
          registerNumber: user.registerNumber,
          profile: user.profile
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}