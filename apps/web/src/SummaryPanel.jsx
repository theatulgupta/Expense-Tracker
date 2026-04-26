import { useQuery } from "@tanstack/react-query";
import { fetchSummary } from "./lib/api";

export default function SummaryPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
  });

  if (isLoading) return <p>loading summary...</p>;
  if (isError) return <p className="error">could not load summary.</p>;
  if (!data || data.length === 0) return null;

  return (
    <section className="card">
      <h2>by category</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>category</th>
              <th className="right">count</th>
              <th className="right">total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.category}>
                <td>{row.category}</td>
                <td className="right">{row.count}</td>
                <td className="right">₹{Number(row.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
