// ---------------------------
// Form Block Type Definitions
// ---------------------------

export type FormCategoryType = "Layout" | "Field";

/**
 * All available block types in the form builder.
 * Extend this list when you add new blocks.
 */
export type FormBlockType =
  | "RowLayout"
  | "ColumnLayout" // ✅ Added this
  | "RadioSelect"
  | "TextField"
  | "TextArea"
  | "StarRating"
  | "Heading"
  | "Paragraph";

export type HandleBlurFunc = (key: string, value: string) => void;

export type FormErrorsType = Record<string, string>;

/**
 * A single instance of a block that exists on the canvas.
 * It can contain nested childblocks (for layout-type blocks).
 */
export type FormBlockInstance = {
  id: string;
  blockType: FormBlockType;
  attributes?: Record<string, any>;
  childblocks?: FormBlockInstance[];
  isLocked?: boolean;
};

/**
 * Blueprint for defining how a block behaves,
 * how it’s rendered on the canvas, and how it’s used in forms.
 */
export type ObjectBlockType = {
  blockCategory: FormCategoryType;
  blockType: FormBlockType;

  /** Factory to create new block instances */
  createInstance: (id: string) => FormBlockInstance;

  /** Sidebar button for adding this block */
  blockBtnElement: {
    icon: React.ElementType;
    label: string;
  };

  /** Editor (canvas) view of the block */
  canvasComponent: React.FC<{
    blockInstance: FormBlockInstance;
  }>;

  /** Live form (preview/submission) view */
  formComponent: React.FC<{
    blockInstance: FormBlockInstance;
    isError?: boolean;
    errorMessage?: string;
    handleBlur?: HandleBlurFunc;
    formErrors?: FormErrorsType;
  }>;

  /** Settings sidebar properties view */
  propertiesComponent: React.FC<{
    positionIndex?: number;
    parentId?: string;
    blockInstance: FormBlockInstance;
  }>;
};

/**
 * All registered block definitions mapped by type.
 * Example: FormBlocks["TextField"].canvasComponent
 */
export type FormBlocksType = {
  [key in FormBlockType]: ObjectBlockType;
};
