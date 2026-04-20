import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import generateDOCX from "@/lib/resumeDocxGenerator";
import generatePDF from "@/lib/resumePdfGenerator";

// Helpers
function ensureArray(val) {
  return Array.isArray(val) ? val : [];
}
function ensureString(val) {
  return val == null ? "" : String(val);
}

export async function POST(request) {
  try {
    const { regNo, format } = await request.json();

    if (!regNo) {
      return NextResponse.json({ message: "regNo is required" }, { status: 400 });
    }

    if (!["pdf", "docx"].includes(format)) {
      return NextResponse.json({ message: 'format must be "pdf" or "docx"' }, { status: 400 });
    }

    await connectDB();

    const user = await UserProfile.findOne({ registerNumber: regNo }).lean();

    if (!user) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const p = user.profile || {};

    const resumeData = {
      fullName: ensureString(user.name),
      email: ensureString(user.email),
      phone: ensureString(user.phone),
      registerNumber: ensureString(user.registerNumber),
      department: ensureString(user.department),
      batchYear: ensureString(user.batchYear),
      designation: ensureString(p.designation),
      summary: ensureString(p.summary || p.bio),
      skills: ensureArray(p.skills),

      linkedin: ensureString(p.linkedin),
      github: ensureString(p.github),
      website: ensureString(p.website),

      experience: ensureArray(p.experience).map((e) => ({
        jobTitle: ensureString(e.role),
        company: ensureString(e.company),
        startDate: ensureString(e.duration),
        description: ensureString(e.description),
      })),

      education: ensureArray(p.education).map((e) => ({
        degree: ensureString(e.degree),
        institution: ensureString(e.institution),
        startDate: ensureString(e.year),
      })),

      projects: ensureArray(p.projects).map((proj) => ({
        title: ensureString(proj.title),
        techStack: ensureArray(proj.techStack),
        description: ensureString(proj.description),
      })),

      certifications: ensureArray(p.certifications).map((cert) => ({
        name: ensureString(cert.name),
        issuer: ensureString(cert.issuer),
      })),

      languages: ensureArray(p.languages),

      // ─── NEW ACADEMIC FIELDS ─────────────────────────────────
      tenthPercentage: p.tenthPercentage,
      twelfthPercentage: p.twelfthPercentage,
      cgpa: p.cgpa,
      cgpaSemester: p.cgpaSemester,
    };

    let buffer, contentType, fileName;

    try {
      if (format === "pdf") {
        buffer = await generatePDF(resumeData);
        contentType = "application/pdf";
        fileName = `resume_${regNo}.pdf`;
      } else {
        buffer = await generateDOCX(resumeData);
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        fileName = `resume_${regNo}.docx`;
      }
    } catch (genErr) {
      console.error("[Generator Error]", genErr);
      return NextResponse.json({ message: `Generator failed: ${genErr.message}` }, { status: 500 });
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("[Resume API Error]", err);
    return NextResponse.json({ message: `Failed to generate resume: ${err.message}` }, { status: 500 });
  }
}