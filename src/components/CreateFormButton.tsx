"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { ImSpinner2 } from "react-icons/im";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const DynamicFieldSchema = z.object({
  name: z
    .string()
    .min(2, "Form name must be at least 2 characters")
    .max(50, "Form name must be at most 50 characters"),
  description: z
    .string()
    .max(200, "Description must be at most 200 characters")
    .optional(),
});

function CreateFormButton() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const form = useForm<z.infer<typeof DynamicFieldSchema>>({
    resolver: zodResolver(DynamicFieldSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: z.infer<typeof DynamicFieldSchema>) {
    try {
      console.log("[CreateFormButton] Submitting form with user session:", session?.user);

      if (!session?.user?.tenantId || !session?.user?.role) {
        toast.error("Missing tenant or role. Please log in again.");
        return;
      }

      const res = await fetch("/api/tenants/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": session.user.role,
          "x-tenant-id": session.user.tenantId,
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[CreateFormButton] Failed to create form:", text);
        throw new Error(text);
      }

      const data = await res.json();

      toast.success(`✅ Form "${data.form.name}" created successfully!`);
      router.push(`/forms/builder/${data.form.id}`);
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("[CreateFormButton] Error:", error);
      toast.error("❌ Failed to create form. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white",
            "bg-gradient-to-r from-blue-600 to-blue-500 shadow-md",
            "hover:from-blue-700 hover:to-blue-600 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          )}
        >
          <BsFileEarmarkPlus className="text-lg" />
          <span>Create Form</span>
        </motion.button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border border-gray-200/20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Create a New Form
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Define your form name and optional description to start collecting
            submissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Form Name
                  </FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      placeholder="Enter form name"
                      className={cn(
                        "w-full rounded-md border border-gray-300/30 dark:border-gray-700/60 bg-transparent",
                        "px-3 py-2 text-sm placeholder:text-gray-400",
                        "focus:border-blue-500 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 transition-all"
                      )}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500 mt-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Description{" "}
                    <span className="text-gray-400">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="Short description about this form"
                      rows={3}
                      className={cn(
                        "w-full rounded-md border border-gray-300/30 dark:border-gray-700/60 bg-transparent",
                        "px-3 py-2 text-sm placeholder:text-gray-400 resize-none",
                        "focus:border-blue-500 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 transition-all"
                      )}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500 mt-1" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={form.formState.isSubmitting}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white font-medium",
                  "bg-blue-600 hover:bg-blue-700 transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60"
                )}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <ImSpinner2 className="animate-spin text-lg" />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Form"
                )}
              </motion.button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateFormButton;
