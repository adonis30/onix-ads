import {DynamicForm, FormSettings } from "@prisma/client";

export type FormWithSettings = DynamicForm & { settings: FormSettings };
