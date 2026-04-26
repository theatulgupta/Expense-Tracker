import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpense } from "../lib/api";

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState("");

  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      setSuccessMsg("Expense saved!");
      setTimeout(() => setSuccessMsg(""), 3000);
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  return { mutation, successMsg };
}
