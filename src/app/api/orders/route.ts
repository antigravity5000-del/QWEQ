export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { safeRead, atomicWrite } from '@/lib/storage';

const ordersFilePath = path.join(process.cwd(), 'orders.json');

export async function GET() {
  try {
    const orders = await safeRead(ordersFilePath);
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newOrder = await request.json();
    const orders = await safeRead(ordersFilePath);
    orders.unshift(newOrder);
    await atomicWrite(ordersFilePath, orders);
    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server Overload' }, { status: 500 });
  }
}