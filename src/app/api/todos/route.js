import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';

// GET - Ambil semua todos
export async function GET() {
  try {
    await connectDB();
    const todos = await Todo.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Buat todo baru
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const todo = await Todo.create(body);
    return NextResponse.json({ success: true, data: todo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}