import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

const BACKEND_TOKEN_EXPIRY = "5m";

export async function GET(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
  const token = await new SignJWT({ sub: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(BACKEND_TOKEN_EXPIRY)
    .sign(secret);

  return NextResponse.json({ token });
}
