import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({error:"Seller management is no longer available."}, {status:410}); }
export const PATCH = POST;
