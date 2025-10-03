import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-options"
import { db } from "@/db/drizzle"
import { questions, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { isAdminUser } from "@/lib/admin"
import { z } from "zod"

// Validation schema for question updates
const updateQuestionSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  tags: z.array(z.string()).optional().default([]),
  allowedEmails: z.array(z.string().email()).optional().default([]),
  isActive: z.boolean().default(true),
})

// GET single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const questionId = parseInt(id)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    // Get the question with owner details
    const questionResult = await db
      .select({
        id: questions.id,
        title: questions.title,
        description: questions.description,
        tags: questions.tags,
        participantCount: questions.participantCount,
        allowedEmails: questions.allowedEmails,
        owner: questions.owner,
        isActive: questions.isActive,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        ownerEmail: users.email,
        ownerUsername: users.username,
      })
      .from(questions)
      .leftJoin(users, eq(questions.owner, users.uid))
      .where(eq(questions.id, questionId))
      .limit(1)

    if (questionResult.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const question = questionResult[0]

    // Check access permissions (all questions are private)
    const userEmail = session.user.email
    const isAdmin = isAdminUser(userEmail)
    
    if (!question.isActive && !isAdmin) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (!isAdmin && !(question.allowedEmails || []).includes(userEmail)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: question,
    })
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch question",
      },
      { status: 500 }
    )
  }
}

// PUT update question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin
    if (!isAdminUser(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const questionId = parseInt(id)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateQuestionSchema.parse(body)

    // Check if question exists
    const existingQuestion = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)

    if (existingQuestion.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Update the question
    const updatedQuestion = await db
      .update(questions)
      .set({
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        allowedEmails: validatedData.allowedEmails,
        isActive: validatedData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionId))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedQuestion[0],
      message: "Question updated successfully",
    })
  } catch (error) {
    console.error("Error updating question:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          message: error.issues[0]?.message || "Invalid input data",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to update question",
      },
      { status: 500 }
    )
  }
}

// DELETE question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin
    if (!isAdminUser(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const questionId = parseInt(id)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    // Check if question exists
    const existingQuestion = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)

    if (existingQuestion.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Delete the question
    await db.delete(questions).where(eq(questions.id, questionId))

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to delete question",
      },
      { status: 500 }
    )
  }
}