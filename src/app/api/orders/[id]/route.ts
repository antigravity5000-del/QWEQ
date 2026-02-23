import { NextResponse } from 'next/server';
import path from 'path';
import { safeRead, atomicWrite } from '@/lib/storage';

const ordersFilePath = path.join(process.cwd(), 'orders.json');

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const { status } = await request.json();

    const orders = await safeRead(ordersFilePath);
    const orderIndex = orders.findIndex((order: any) => order.id === orderId);

    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update the order status
    orders[orderIndex].status = status;

    // Save the updated orders
    await atomicWrite(ordersFilePath, orders);

    return NextResponse.json({
      success: true,
      order: orders[orderIndex]
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const orders = await safeRead(ordersFilePath);
    const order = orders.find((order: any) => order.id === orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}