import {
  createContext,
  useContext,
  useState,
} from "react";

import ConfirmDialog from "../components/ConfirmDialog";

const ConfirmContext =
  createContext(null);

export function ConfirmProvider({
  children,
}) {
  const [dialog, setDialog] =
    useState(null);

  function confirm(options = {}) {
    return new Promise((resolve) => {
      setDialog({
        title:
          options.title ||
          "تأكيد العملية",

        message:
          options.message ||
          "هل أنت متأكد من تنفيذ هذه العملية؟",

        confirmText:
          options.confirmText ||
          "تأكيد",

        cancelText:
          options.cancelText ||
          "إلغاء",

        type:
          options.type ||
          "warning",

        resolve,
      });
    });
  }

  function close(result) {
    if (!dialog) return;

    dialog.resolve(result);

    setDialog(null);
  }

  return (
    <ConfirmContext.Provider
      value={{
        confirm,
      }}
    >
      {children}

      <ConfirmDialog
        open={Boolean(dialog)}
        title={
          dialog?.title
        }
        message={
          dialog?.message
        }
        confirmText={
          dialog?.confirmText
        }
        cancelText={
          dialog?.cancelText
        }
        type={
          dialog?.type
        }
        onConfirm={() =>
          close(true)
        }
        onCancel={() =>
          close(false)
        }
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context =
    useContext(
      ConfirmContext
    );

  if (!context) {
    throw new Error(
      "useConfirm يجب استخدامه داخل ConfirmProvider"
    );
  }

  return context;
}