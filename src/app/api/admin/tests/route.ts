import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '0');
  const pageSize = 10; // Define how many results per page
  const offset = page * pageSize;

  if (userId) {
    // Fetch tests assigned to a specific user
    const { data: userTests, error: userTestsError } = await supabase
      .from("user_tests")
      .select("test_id")
      .eq("user_id", userId);

    if (userTestsError) {
      return NextResponse.json({ error: userTestsError.message }, { status: 500 });
    }

    const testIds = userTests?.map(ut => ut.test_id) || [];
    
    if (testIds.length === 0) {
      // No tests assigned to this user
      return NextResponse.json([]);
    }

    let query = supabase
      .from("test_types")
      .select("*")
      .in("id", testIds)
      .order("name");
    
    // Add search filter if search term is provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } else {
    // Fetch all tests
    let query = supabase.from("test_types").select("*").order("name");
    
    // Add search filter if search term is provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + pageSize - 1);
    
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase.from("test_types").insert(body).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
  }
  const { data, error } = await supabase.from("test_types").update(body).eq("id", body.id).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
  }
  const { error } = await supabase.from("test_types").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// New endpoint to assign tests to a user
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { userId, testIds } = body;
  
  if (!userId || !testIds) {
    return NextResponse.json({ error: "User ID and test IDs are required" }, { status: 400 });
  }

  // Begin transaction
  const { error: deleteError } = await supabase
    .from("user_tests")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Don't insert if testIds array is empty
  if (testIds.length > 0) {
    const userTestsToInsert = testIds.map((testId: string) => ({
      user_id: userId,
      test_id: testId
    }));

    const { error: insertError } = await supabase
      .from("user_tests")
      .insert(userTestsToInsert);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}