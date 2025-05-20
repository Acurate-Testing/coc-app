import { SampleStatus } from "@/constants/enums";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agency = searchParams.get('agency');
  const search = searchParams.get('search');

  let query = supabase.from("samples").select("*", { count: "exact" }).is("deleted_at", null);
  if (agency) query = query.eq("agency_id", agency);
  if (search) query = query.ilike("name", `%${search}%`);
  query = query.in('status', [SampleStatus.Submitted, SampleStatus.Pass, SampleStatus.Fail]);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}