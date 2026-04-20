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
    let semester = formData.get('semester');
    const fromDate = formData.get('fromDate');
    const toDate = formData.get('toDate');
    const category = formData.get('category') || 'academic';
    const files = formData.getAll('files');

    console.log('📝 Upload data received:', {
      title, type, userId, semester, category,
      descriptionLength: description?.length,
      fileCount: files.length,
      fileNames: files.map(f => f?.name),
    });

    if (!title || !description || !type || !userId || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields or no files uploaded.' },
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
    const maxSize = 5 * 1024 * 1024; // 5MB

    const media = [];

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

      console.log(`☁️ Uploading ${file.name} to Cloudinary...`);
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

      media.push({
        url: uploadResult.secure_url,
        type: 'image',
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        cloudinaryId: uploadResult.public_id,
      });
    }

    console.log('✅ Cloudinary uploads successful');

    // Ensure semester has a valid value (required by schema)
    if (!semester || isNaN(parseInt(semester))) {
      semester = '1'; // default for staff or missing
    }
    const semesterNum = parseInt(semester);
    const validSemester = (semesterNum >= 1 && semesterNum <= 8) ? semesterNum : 1;

    const postData = {
      owner: userId,
      type,
      title,
      description,
      media,
      semester: validSemester, // always set a valid semester
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add participation date for certificates
    if (type === 'certificate' && fromDate) {
      postData.participationDate = { from: new Date(fromDate) };
      if (toDate) {
        postData.participationDate.to = new Date(toDate);
      }
    }

    if (type === 'certificate') {
      if (category) {
        postData.category = category;
      }
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

    return NextResponse.json(
      {
        success: true,
        message: 'Upload successful',
        post: {
          _id: post._id,
          title: post.title,
          description: post.description,
          type: post.type,
          semester: post.semester,
          participationDate: post.participationDate,
          category: post.category,
          media: post.media,
          issuedBy: post.issuedBy,
          tags: post.tags || [],
          techStack: post.techStack || [],
          createdAt: post.createdAt,
          owner: {
            _id: user._id,
            name: user.name,
            registerNumber: user.registerNumber,
            profile: user.profile,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}