import { FiBookmark } from "react-icons/fi";
import { useEffect } from "react";

export default function AdminTable({ columns, data, loading, emptyMsg = "No data found.", emptyIcon }) {
  useEffect(() => {
    if (!document.getElementById("spinner-keyframes")) {
      const style = document.createElement("style");
      style.id = "spinner-keyframes";
      style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  }, []);

  if (loading) return (
    <div style={s.loading}>
      <div style={s.spinner} />
      <span>Loading...</span>
    </div>
  );
  if (!data.length) return (
    <div style={s.empty}>
      {emptyIcon || <FiBookmark size={56} color="#bdc3c7" style={{ marginBottom: 10 }} />}
      <div>{emptyMsg}</div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <table style={s.table}>
        <thead>
          <tr style={s.thead}>
            {columns.map((c) => <th key={c.key} style={s.th}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              {columns.map((c) => (
                <td key={c.key} style={s.td}>
                  {c.render ? c.render(row) : row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const s = {
  wrap: { overflowX: "auto", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  thead: { background: "#2c3e50" },
  th: { padding: "12px 16px", color: "#fff", textAlign: "left", fontSize: "0.82rem", fontWeight: "600", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: "12px 16px", fontSize: "0.88rem", color: "#444", verticalAlign: "middle", fontWeight: "600" },
  loading: { padding: "40px", textAlign: "center", color: "#888", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  spinner: { width: "36px", height: "36px", border: "3px solid #e0e0e0", borderTop: "3px solid #2c3e50", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  empty: { padding: "40px", textAlign: "center", color: "#aaa", fontSize: "0.95rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
};
