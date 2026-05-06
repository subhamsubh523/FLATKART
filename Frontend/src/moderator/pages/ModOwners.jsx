import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ModAPI from "../modApi";
import AdminTable from "../../admin/components/AdminTable";
import { FiUsers, FiX, FiCheckCircle, FiSlash, FiUserCheck, FiTrash2, FiAlertTriangle } from "react-icons/fi";

export default function ModOwners({ mod }) {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [avatarModal, setAvatarModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const has = (p) => mod?.permissions?.includes(p);

  useEffect(() => {
    ModAPI.get("/owners").then(({ data }) => { setOwners(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    const { data } = await ModAPI.patch(`/owners/${id}/toggle`);
    setOwners((prev) => prev.map((o) => o._id === id ? { ...o, blocked: data.blocked } : o));
  };

  const remove = async (id) => {
    await ModAPI.delete(`/owners/${id}`);
    setOwners((prev) => prev.filter((o) => o._id !== id));
    setDeleteTarget(null);
  };

  const filtered = owners.filter((o) =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "avatar", label: "Avatar", render: (o) => o.avatar
      ? <img src={o.avatar} alt="" style={{ ...cs.avatar, cursor: "zoom-in" }} onClick={() => setAvatarModal({ src: o.avatar, name: o.name })} />
      : <div style={cs.avatarFallback}>{o.name?.[0]?.toUpperCase()}</div> },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "createdAt", label: "Joined", render: (o) => new Date(o.createdAt).toLocaleDateString() },
    { key: "status", label: "Status", render: (o) => {
      const blocked = o.blocked;
      return (
        <span style={{ ...cs.badge, background: blocked ? "#fdf0f0" : "#eafaf1", color: blocked ? "#e74c3c" : "#27ae60", border: `1px solid ${blocked ? "#f5c6cb" : "#a9dfbf"}` }}>
          {blocked
            ? <><FiSlash size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Blocked</>
            : <><FiCheckCircle size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Active</>}
        </span>
      );
    }},
    { key: "actions", label: "Actions", render: (o) => (
      <div style={cs.actions}>
        {has("owners:update") && <button style={{ ...cs.btn, background: o.blocked ? "#eafaf1" : "#fdf0f0", color: o.blocked ? "#27ae60" : "#e74c3c", border: o.blocked ? "1px solid #a9dfbf" : "1px solid #f5c6cb" }} onClick={() => toggle(o._id)}>{o.blocked ? <><FiUserCheck size={12} style={{ marginRight: 4 }} />Unblock</> : <><FiSlash size={12} style={{ marginRight: 4 }} />Block</>}</button>}
        {has("owners:delete") && <button style={{ ...cs.btn, background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb" }} onClick={() => setDeleteTarget(o)}><FiTrash2 size={12} style={{ marginRight: 4 }} />Delete</button>}
        {!has("owners:update") && !has("owners:delete") && <span style={{ color: "#ccc", fontSize: "0.8rem" }}>View only</span>}
      </div>
    )},
  ];

  return (
    <div>
      <div style={cs.header}>
        <div>
          <h2 style={cs.title}><FiUsers size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />Owners</h2>
          <p style={cs.sub}>{owners.length} registered owners</p>
        </div>
        <input style={cs.search} placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <AdminTable columns={columns} data={filtered} loading={loading} emptyMsg="No owners found." />

      {avatarModal && createPortal(
        <div onClick={() => setAvatarModal(null)} style={cs.lbOverlay}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", background: "#1a252f", borderRadius: "16px", padding: "32px 40px" }}>
            <button onClick={() => setAvatarModal(null)} style={cs.lbClose}><FiX size={14} /></button>
            <img src={avatarModal.src} alt={avatarModal.name} style={cs.lbImg} />
            <p style={{ color: "#fff", fontWeight: "700", fontSize: "1rem", margin: 0 }}>{avatarModal.name}</p>
          </div>
        </div>,
        document.body
      )}

      {deleteTarget && (
        <div style={cs.overlay} onClick={() => setDeleteTarget(null)}>
          <div style={cs.popup} onClick={(e) => e.stopPropagation()}>
            <button style={cs.closeBtn} onClick={() => setDeleteTarget(null)}><FiX size={16} /></button>
            <div style={cs.iconWrap}><FiAlertTriangle size={28} color="#e74c3c" /></div>
            <h3 style={cs.popupTitle}>Confirm Delete</h3>
            <p style={cs.popupMsg}>Delete owner <strong>{deleteTarget.name}</strong> and all their flats? This cannot be undone.</p>
            <div style={cs.popupActions}>
              <button style={cs.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button style={cs.confirmBtn} onClick={() => remove(deleteTarget._id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cs = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: 0, color: "#888", fontSize: "0.9rem" },
  search: { padding: "10px 16px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontSize: "0.92rem", minWidth: "260px" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover" },
  avatarFallback: { width: "34px", height: "34px", borderRadius: "50%", background: "#2c3e50", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.9rem" },
  badge: { display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600" },
  actions: { display: "flex", gap: "8px" },
  btn: { padding: "5px 14px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },
  lbOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" },
  lbImg: { width: "220px", height: "220px", borderRadius: "50%", objectFit: "cover", border: "4px solid #fff" },
  lbClose: { position: "absolute", top: "-12px", right: "-12px", background: "#fff", border: "none", color: "#333", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" },
  popup: { background: "#fff", borderRadius: "14px", padding: "32px 28px 24px", width: "100%", maxWidth: "380px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", textAlign: "center", position: "relative" },
  closeBtn: { position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" },
  iconWrap: { width: "56px", height: "56px", borderRadius: "50%", background: "#fdf0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  popupTitle: { margin: "0 0 8px", fontSize: "1.1rem", fontWeight: "700", color: "#2c3e50" },
  popupMsg: { margin: "0 0 24px", fontSize: "0.9rem", color: "#666", lineHeight: 1.5 },
  popupActions: { display: "flex", gap: "10px", justifyContent: "center" },
  cancelBtn: { padding: "10px 24px", background: "#f0f2f5", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "600", color: "#555" },
  confirmBtn: { padding: "10px 24px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "700", color: "#fff" },
};
