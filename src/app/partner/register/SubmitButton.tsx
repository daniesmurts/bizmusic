"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#5cf387] text-black font-black uppercase tracking-widest text-sm py-4 rounded-2xl hover:bg-[#5cf387]/90 transition mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Загрузка...
        </>
      ) : (
        "Зарегистрироваться"
      )}
    </button>
  );
}
