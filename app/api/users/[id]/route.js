import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request, { params }) {
  console.log('🔍 GET /api/users/[id] called');
  
  try {
    await dbConnect();
    
    const { id } = await params;
    console.log('Looking for user with ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const cleanId = id.toString().trim();
    console.log('Cleaned ID:', cleanId);
    
    const user = await User.findOne({ registerNumber: cleanId }).select('-password');
    
    if (user) {
      console.log('✅ Found user by registerNumber:', user.name);
      return NextResponse.json({ 
        success: true, 
        user: user.toObject()
      });
    }
    
    console.log('Not found by registerNumber, trying by _id...');
    try {
      const userById = await User.findById(cleanId).select('-password');
      if (userById) {
        console.log('✅ Found user by _id:', userById.name);
        return NextResponse.json({ 
          success: true, 
          user: userById.toObject()
        });
      }
    } catch (err) {
      console.log('Not a valid MongoDB ID format');
    }
    
    console.log('❌ User not found with any ID type');
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('❌ GET user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  console.log('🔄 PUT /api/users/[id] called');
  
  try {
    await dbConnect();
    
    const { id } = await params;
    const { userId, role, updates } = await request.json();

    console.log('Updating user:', id, 'Request from user:', userId);

    const targetUser = await User.findOne({ registerNumber: id });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isAdmin = role === 'admin';
    const isSelf = targetUser._id.toString() === userId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updateObj = {};
    
    if (updates.profile) {
      const existingProfile = targetUser.profile.toObject ? targetUser.profile.toObject() : targetUser.profile;
      
      updateObj.profile = {
        ...existingProfile,
        bio: updates.profile.bio ?? existingProfile.bio ?? '',
        interests: Array.isArray(updates.profile.interests)
          ? updates.profile.interests
          : updates.profile.interests?.split(',').map(i => i.trim()).filter(i => i) || [],
        designation: updates.profile.designation ?? existingProfile.designation ?? '',
        summary: updates.profile.summary ?? existingProfile.summary ?? '',
        github: updates.profile.github ?? existingProfile.github ?? '',
        linkedin: updates.profile.linkedin ?? existingProfile.linkedin ?? '',
        portfolio: updates.profile.portfolio ?? existingProfile.portfolio ?? '',
        skills: Array.isArray(updates.profile.skills)
          ? updates.profile.skills
          : existingProfile.skills || [],
        experience: Array.isArray(updates.profile.experience)
          ? updates.profile.experience
          : existingProfile.experience || [],
        education: Array.isArray(updates.profile.education)
          ? updates.profile.education
          : existingProfile.education || [],
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUser._id,
      { $set: updateObj },
      { new: true }
    ).select('-password');

    console.log('✅ User updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Profile updated',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ PUT user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}