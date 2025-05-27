import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    if (!data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }
    const decrypted = decrypt(data);
    return NextResponse.json({ decrypted });
  } catch (error) {
    console.error("Decryption error:", error);
    return NextResponse.json({ error: "Failed to decrypt" }, { status: 500 });
  }
} 