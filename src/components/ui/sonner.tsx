"use client";

import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconLoader2, IconCircleX } from "@tabler/icons-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Notifications : noir et blanc cassé, icônes Tabler, coins arrondis KAMPLY. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      icons={{
        success: <IconCircleCheck className="size-5 text-signal-ink" />,
        info: <IconInfoCircle className="size-5" />,
        warning: <IconAlertTriangle className="size-5 text-brand" />,
        error: <IconCircleX className="size-5 text-destructive" />,
        loading: <IconLoader2 className="size-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-0 !bg-ink !text-paper !shadow-xl !font-sans",
          description: "!text-paper/70",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
