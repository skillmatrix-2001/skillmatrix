import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import { sendOTPEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    console.log('[Forgot Password] Step 1: Connecting to DB');
    await dbConnect();
    console.log('[Forgot Password] DB connected');

    const body = await request.json();
    console.log('[Forgot Password] Request body:', body);

    const { identifier, email, role } = body;

    if (!identifier || !email || !role) {
      console.log('[Forgot Password] Missing fields');
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    let user = null;
    if (role === 'student') {
      console.log('[Forgot Password] Searching student with registerNumber:', identifier);
      user = await User.findOne({ registerNumber: identifier, role: 'student' });
    } else if (role === 'staff') {
      console.log('[Forgot Password] Searching staff with staffId:', identifier);
      user = await User.findOne({ staffId: identifier, role: 'staff' });
    } else {
      console.log('[Forgot Password] Invalid role:', role);
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    console.log('[Forgot Password] User found:', user ? user._id : 'none');

    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with this ID' }, { status: 404 });
    }

    if (!user.email || user.email.trim() === '') {
      return NextResponse.json({ success: false, error: 'No email registered for this account. Please contact admin.' }, { status: 400 });
    }

    if (user.email.toLowerCase().trim() !== normalizedEmail) {
      return NextResponse.json({ success: false, error: 'Email does not match our records' }, { status: 400 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('[Forgot Password] Deleting old OTPs for identifier:', identifier);
    await OTP.deleteMany({ identifier });

    console.log('[Forgot Password] Creating new OTP record');
    await OTP.create({ identifier, email: normalizedEmail, otp, expiresAt });

    // Try sending email with specific error handling
    console.log('[Forgot Password] Attempting to send email to:', normalizedEmail);
    try {
      await sendOTPEmail(normalizedEmail, otp);
      console.log('[Forgot Password] ✅ Email sent successfully');
    } catch (emailError) {
      console.error('[Forgot Password] ❌ Email sending failed:', emailError);
      // You can decide to throw or return an error; here we throw to trigger the outer catch
      throw new Error('Failed to send OTP email. Please check email configuration.');
    }

    return NextResponse.json({ success: true, message: 'OTP sent to your registered email address.' });
  } catch (error) {
    console.error('[Forgot Password] Caught error:', error);
    console.error(error.stack);
    return NextResponse.json({ success: false, error: 'Unable to process request. Please try again later.' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}