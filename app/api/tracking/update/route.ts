// app/api/tracking/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { recordLocationUpdate } from '@/actions/tracking';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Validate required fields
    const vehicleId = formData.get('vehicleId');
    const lat = formData.get('lat');
    const lng = formData.get('lng');
    
    if (!vehicleId || !lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await recordLocationUpdate(formData);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}