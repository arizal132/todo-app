import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Ambil todo berdasarkan ID (hanya milik user yang login)
export async function GET(request, { params }) {
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
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const todo = await Todo.findOne({ 
      _id: params.id, 
      userId: user.userId 
    });
    
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

// PUT - Update todo (hanya milik user yang login)
export async function PUT(request, { params }) {
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
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const todo = await Todo.findOneAndUpdate(
      { _id: params.id, userId: user.userId },
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

// DELETE - Hapus todo (hanya milik user yang login)
export async function DELETE(request, { params }) {
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
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const todo = await Todo.findOneAndDelete({
      _id: params.id,
      userId: user.userId
    });
    
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