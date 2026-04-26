import { useState } from "react";
import { useExpenses } from "./hooks/useExpenses";
import { useCreateExpense } from "./hooks/useCreateExpense";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseTable from "./components/ExpenseTable";
import SummaryPanel from "./components/SummaryPanel";

export default function App() {
  const [filterCategory, setFilterCategory] = useState("");
  const [sort, setSort] = useState("date_desc");

  const { items, total, isLoading, isError, error, refetch } = useExpenses({
    category: filterCategory,
    sort,
  });

  const { mutation, successMsg } = useCreateExpense();

  return (
    <main className="page">
      <header className="header">
        <h1>Expense Tracker</h1>
        <p>Track spending with reliable totals</p>
      </header>

      <ExpenseForm
        onSubmit={mutation.mutate}
        isPending={mutation.isPending}
        successMsg={successMsg}
      />

      <ExpenseTable
        items={items}
        total={total}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        filterCategory={filterCategory}
        onFilterCategory={setFilterCategory}
        sort={sort}
        onSort={setSort}
      />

      <SummaryPanel />
    </main>
  );
}
