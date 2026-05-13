import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/paymongo";

export async function POST(req: Request) {
  try {
    const { amount, description } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const paymentIntent = await createPaymentIntent(
      amount,
      description || "DepAid Pro Subscription"
    );

    return NextResponse.json({
      clientKey: paymentIntent.attributes.client_key,
      id: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("[paymongo intent] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
