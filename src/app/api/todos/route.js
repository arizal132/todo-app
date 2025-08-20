import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

// GET - Ambil todos milik user yang login
export async function GET(request) {
  try {
    await connectDB();
    
    // Verifikasi authentication
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const todos = await Todo.find({ userId: user.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Buat todo baru untuk user yang login
export async function POST(request) {
  try {
    await connectDB();
    
    // Verifikasi authentication
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const todo = await Todo.create({
      ...body,
      userId: user.userId,
    });
    
    return NextResponse.json({ success: true, data: todo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}