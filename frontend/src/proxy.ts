import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)"],
};
