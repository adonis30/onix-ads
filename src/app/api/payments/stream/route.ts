// src/app/api/payments/stream/route.ts
import { NextRequest } from "next/server";
import { redisSubscriber } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  if (!reference) return new Response("Reference required", { status: 400 });

  const channel = `payment:${reference}`;

  const stream = new ReadableStream({
    start(controller) {
      const send = (msg: any) => controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);

      const messageHandler = (_chan: string, message: string) => {
        const msg = JSON.parse(message);
        send(msg);
        if (["SUCCESS", "FAILED"].includes(msg.status)) controller.close();
      };

      redisSubscriber.on("message", messageHandler);
      redisSubscriber.subscribe(channel).catch(err => controller.error(err));

      req.signal.addEventListener("abort", () => {
        redisSubscriber.removeListener("message", messageHandler);
        redisSubscriber.unsubscribe(channel).catch(() => {});
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
