
import { FormBlocks } from "@/lib/form-blocks";
import React from "react";
import { FormBlockInstance } from "../../@types/form-block.type";

const ChildCanvasComponentWrapper = ({
  blockInstance,
}: {
  blockInstance: FormBlockInstance;
}) => {
  const CanvasComponent = FormBlocks[blockInstance.blockType]?.canvasComponent;
  if (!CanvasComponent) return null;

  return <CanvasComponent blockInstance={blockInstance} />;
};

export default ChildCanvasComponentWrapper;
