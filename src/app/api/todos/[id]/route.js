import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';
import mongoose from 'mongoose';

// GET - Ambil todo berdasarkan ID
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const todo = await Todo.findById(params.id);
    if (!todo) {
      return NextResponse.json(
        { success: false, error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update todo berdasarkan ID
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const todo = await Todo.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!todo) {
      return NextResponse.json(
        { success: false, error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// DELETE - Hapus todo berdasarkan ID
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const todo = await Todo.findByIdAndDelete(params.id);
    if (!todo) {
      return NextResponse.json(
        { success: false, error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}