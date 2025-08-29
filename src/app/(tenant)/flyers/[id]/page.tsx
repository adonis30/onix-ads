// src/app/(root)/dashboard/flyers/[id]/page.tsx
import { prisma } from "@/lib/prisma"; // if you fetch data
import React from "react";

// Server Component
export default async function FlyerPage(){
 

  const flyerId = "some-flyer-id"; // Replace with actual flyer ID logic

  // Example: fetch flyer data
  // const flyer = await prisma.flyer.findUnique({ where: { id: flyerId } });

  return (
    <div>
      <h1>Flyer ID: {flyerId}</h1>
      {/* Render flyer data here */}
    </div>
  );
}

