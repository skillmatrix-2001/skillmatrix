import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get('token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let userId;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      userId = decoded.split(':')[0];
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const staffUser = await User.findById(userId).select('department role');
    if (!staffUser || staffUser.role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const semester = searchParams.get('semester');
    const batch = searchParams.get('batch');

    const pipeline = [
      { $match: { role: 'student', department: staffUser.department } },
    ];

    if (batch && batch !== 'all') {
      pipeline.push({ $match: { batchYear: parseInt(batch) } });
    }

    const lookupPipeline = [
      { $match: { $expr: { $eq: ['$owner', '$$studentId'] } } },
    ];
    if (semester && semester !== 'all') {
      lookupPipeline.push({ $match: { semester: parseInt(semester) } });
    }

    pipeline.push({
      $lookup: {
        from: 'posts',
        let: { studentId: '$_id' },
        pipeline: lookupPipeline,
        as: 'posts'
      }
    });

    if (search) {
      const regex = new RegExp(search, 'i');
      // Calculate relevance score
      pipeline.push({
        $addFields: {
          score: {
            $sum: [
              // Student fields
              { $cond: [{ $regexMatch: { input: "$name", regex: regex } }, 5, 0] },
              { $cond: [{ $regexMatch: { input: "$registerNumber", regex: regex } }, 5, 0] },
              { $cond: [{ $regexMatch: { input: "$profile.bio", regex: regex } }, 3, 0] },
              // Interests (array)
              {
                $sum: {
                  $map: {
                    input: "$profile.interests",
                    as: "interest",
                    in: { $cond: [{ $regexMatch: { input: "$$interest", regex: regex } }, 2, 0] }
                  }
                }
              },
              // Posts fields
              {
                $sum: {
                  $map: {
                    input: "$posts",
                    as: "post",
                    in: {
                      $sum: [
                        { $cond: [{ $regexMatch: { input: "$$post.title", regex: regex } }, 2, 0] },
                        { $cond: [{ $regexMatch: { input: "$$post.description", regex: regex } }, 1, 0] },
                        {
                          $sum: {
                            $map: {
                              input: "$$post.tags",
                              as: "tag",
                              in: { $cond: [{ $regexMatch: { input: "$$tag", regex: regex } }, 1, 0] }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      });
      // Filter only students with score > 0
      pipeline.push({ $match: { score: { $gt: 0 } } });
      // Sort by score descending (most relevant first)
      pipeline.push({ $sort: { score: -1 } });
    } else {
      // No search: sort by register number ascending
      pipeline.push({ $sort: { registerNumber: 1 } });
    }

    const students = await User.aggregate(pipeline);
    const batchYears = [...new Set(students.map(s => s.batchYear))].sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      students,
      batchYears,
      department: staffUser.department
    });
  } catch (error) {
    console.error('Staff students error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}