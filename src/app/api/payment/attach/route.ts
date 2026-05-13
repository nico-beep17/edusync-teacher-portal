import { NextResponse } from "next/server";
import { attachPaymentMethod } from "@/lib/paymongo";

export async function POST(req: Request) {
  try {
    const { paymentIntentId, paymentMethodId } = await req.json();

    if (!paymentIntentId || !paymentMethodId) {
      return NextResponse.json(
        { error: "Missing paymentIntentId or paymentMethodId" },
        { status: 400 }
      );
    }

    const result = await attachPaymentMethod(paymentIntentId, paymentMethodId);

    return NextResponse.json({
      status: result.attributes.status,
      id: result.id,
    });
  } catch (error: any) {
    console.error("[paymongo attach] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to attach payment method" },
      { status: 500 }
    );
  }
}
