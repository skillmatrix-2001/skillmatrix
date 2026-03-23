import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { staffId, email } = await request.json();

    if (!staffId || !email) {
      return NextResponse.json({ error: 'Staff ID and email are required' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { staffId, role: 'staff' },
      { email },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Update email error:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}