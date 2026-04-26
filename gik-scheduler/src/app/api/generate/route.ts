import { NextResponse } from 'next/server';
import { CSPEngine } from '@/lib/csp';
import { FullData } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const data: FullData = await req.json();
    
    // Server-side validation
    if (!data || !data.courses || !data.teachers || !data.rooms || !data.sections || !data.timeSlots) {
      return NextResponse.json({ error: 'Invalid data payload' }, { status: 400 });
    }

    const engine = new CSPEngine(data);
    const result = engine.run();

    return NextResponse.json(result);
  } catch (error) {
    console.error('CSP Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
