import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const rawTier = body?.tier as string | undefined;

    if (!id || !rawTier) {
      return NextResponse.json(
        { error: "Missing id or tier" },
        { status: 400 }
      );
    }

    const tier = rawTier.toUpperCase();

    await prisma.member.update({
      where: { id },
      data: { tier: tier as any },
    });

    revalidatePath("/customize");
    revalidatePath("/send");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/members/[id] error", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.member.delete({
      where: { id },
    });

    revalidatePath("/customize");
    revalidatePath("/send");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/members/[id] error", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
