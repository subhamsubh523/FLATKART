import { useState, useEffect } from "react";
import ModAPI from "../modApi";
import AdminTable from "../../admin/components/AdminTable";
import { FiBookmark, FiCheckCircle, FiSlash, FiUserCheck, FiAlertCircle, FiInfo, FiMapPin, FiHome, FiUser, FiX, FiTrash2, FiAlertTriangle } from "react-icons/fi";

const statusColor = {
  pending:  { bg: "#fef9e7", color: "#f39c12" },
  approved: { bg: "#eafaf1", color: "#27ae60" },
  rejected: { bg: "#fdf0f0", color: "#e74c3c" },
};

export default function ModBookings({ mod }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const has = (p) => mod?.permissions?.includes(p);

  useEffect(() => {
    ModAPI.get("/bookings").then(({ data }) => { setBookings(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const { data } = await ModAPI.patch(`/bookings/${id}/status`, { status });
    setBookings((prev) => prev.map((b) => b._id === id ? data : b));
  };

  const toggleOwnerBooking = async (b) => {
    const ownerId = b.owner?._id || b.flat_id?.owner_id;
    if (!ownerId) return;
    const { data } = await ModAPI.patch(`/owners/${ownerId}/toggle-booking`);
    setBookings((prev) => prev.map((bk) =>
      bk.owner?._id?.toString() === ownerId?.toString() ||
      bk.flat_id?.owner_id?.toString() === ownerId?.toString()
        ? { ...bk, owner: { ...bk.owner, bookingRestricted: data.bookingRestricted } }
        : bk
    ));
  };

  const remove = async (id) => {
    await ModAPI.delete(`/bookings/${id}`);
    setBookings((prev) => prev.filter((b) => b._id !== id));
    setDeleteTarget(null);
  };

  const filtered = bookings.filter((b) => {
    const matchSearch = !search ||
      b.flat_id?.location?.toLowerCase().includes(search.toLowerCase()) ||
      b.tenant_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.tenant_id?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { key: "flat", label: "Flat", render: (b) => {
      const f = b.flat_id;
      return (
        <div style={{ maxWidth: "180px" }}>
          <p style={{ margin: "0 0 3px", fontWeight: "700", fontSize: "0.88rem", color: "#2c3e50" }}>{f?.type || "—"} ₹{f?.price?.toLocaleString()}/month</p>
          {f?.roomWidth && f?.roomBreadth && <p style={{ margin: 0, fontSize: "0.76rem", color: "#555" }}>{f.roomWidth} × {f.roomBreadth} ft</p>}
        </div>
      );
    }},
    { key: "address", label: "Address", render: (b) => {
      const f = b.flat_id;
      const address = [f?.houseNo, f?.locality, f?.city, f?.district, f?.state, f?.pincode].filter(Boolean).join(", ");
      return (
        <div style={{ maxWidth: "220px" }}>
          {address && <p style={{ margin: "0 0 2px", fontSize: "0.76rem", color: "#000", fontWeight: "600" }}>{address}</p>}
          {f?.landmark && <p style={{ margin: 0, fontSize: "0.74rem", color: "#aaa" }}>Near: {f.landmark}</p>}
        </div>
      );
    }},
    { key: "owner", label: "Owner", render: (b) => (
      <div>
        <p style={{ margin: 0, fontWeight: "600", fontSize: "0.88rem" }}>{b.owner?.name || "—"}</p>
        <p style={{ margin: 0, color: "#888", fontSize: "0.78rem" }}>{b.owner?.email || ""}</p>
      </div>
    )},
    { key: "tenant", label: "Tenant", render: (b) => (
      <div>
        <p style={{ margin: 0, fontWeight: "600", fontSize: "0.88rem" }}>{b.tenant_id?.name || "—"}</p>
        <p style={{ margin: 0, color: "#888", fontSize: "0.78rem" }}>{b.tenant_id?.email}</p>
      </div>
    )},
    { key: "status", label: "Status", render: (b) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ ...cs.badge, background: b.owner?.bookingRestricted ? "#fdf0f0" : "#eafaf1", color: b.owner?.bookingRestricted ? "#e74c3c" : "#27ae60", border: `1px solid ${b.owner?.bookingRestricted ? "#f5c6cb" : "#a9dfbf"}` }}>
          {b.owner?.bookingRestricted
            ? <><FiAlertCircle size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Restricted</>
            : <><FiCheckCircle size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />Allowed</>}
        </span>
      </div>
    )},
    { key: "createdAt", label: "Date", render: (b) => new Date(b.createdAt).toLocaleDateString() },
    { key: "actions", label: "Actions", render: (b) => (
      <div style={cs.actions}>
        <button style={cs.detailsBtn} onClick={() => setSelected(b)}><FiInfo size={12} style={{ marginRight: 4 }} />Booking Details</button>
        {b.owner && (has("owners:update") || has("bookings:update")) && (
          <button
            style={{ ...cs.blockBtn, background: b.owner.bookingRestricted ? "#eafaf1" : "#fdf0f0", color: b.owner.bookingRestricted ? "#27ae60" : "#e74c3c", border: `1px solid ${b.owner.bookingRestricted ? "#a9dfbf" : "#f5c6cb"}` }}
            onClick={() => toggleOwnerBooking(b)}
          >
            {b.owner.bookingRestricted
              ? <><FiUserCheck size={12} style={{ marginRight: 4 }} />Unblock</>
              : <><FiSlash size={12} style={{ marginRight: 4 }} />Block</>}
          </button>
        )}
        {has("bookings:delete") && (
          <button style={cs.delBtn} onClick={() => setDeleteTarget(b)}><FiTrash2 size={12} style={{ marginRight: 4 }} />Delete</button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div style={cs.header}>
        <div>
          <h2 style={cs.title}><FiBookmark size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />Bookings</h2>
          <p style={cs.sub}>{bookings.length} total bookings</p>
        </div>
        <div style={cs.filters}>
          <input style={cs.search} placeholder="Search Owner or Tenant" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={cs.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="restricted">Restricted</option>
            <option value="allowed">Allowed</option>
          </select>
        </div>
      </div>
      <AdminTable columns={columns} data={filtered} loading={loading} emptyMsg="No bookings found." />

      {selected && (
        <div style={cs.overlay} onClick={() => setSelected(null)}>
          <div style={cs.modal} onClick={(e) => e.stopPropagation()}>
            <div style={cs.modalHeader}>
              <p style={cs.modalTitle}><FiBookmark size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />Booking Details</p>
              <button style={cs.closeBtn} onClick={() => setSelected(null)}><FiX size={18} /></button>
            </div>
            <div style={cs.sections}>
              <div style={cs.section}>
                <p style={cs.sectionTitle}><FiHome size={13} style={{ marginRight: 6 }} />Flat Info</p>
                <div style={cs.grid}>
                  <Detail label="Type" value={selected.flat_id?.type} />
                  <Detail label="Price" value={selected.flat_id?.price ? `₹${selected.flat_id.price.toLocaleString()}/month` : null} />
                  <Detail label="Room Size" value={selected.flat_id?.roomWidth && selected.flat_id?.roomBreadth ? `${selected.flat_id.roomWidth} × ${selected.flat_id.roomBreadth} ft` : null} />
                  <Detail label="Location" value={selected.flat_id?.location} />
                </div>
              </div>
              <div style={cs.section}>
                <p style={cs.sectionTitle}><FiMapPin size={13} style={{ marginRight: 6 }} />Address</p>
                <div style={cs.grid}>
                  <Detail label="House No." value={selected.flat_id?.houseNo} />
                  <Detail label="Locality" value={selected.flat_id?.locality} />
                  <Detail label="City" value={selected.flat_id?.city} />
                  <Detail label="District" value={selected.flat_id?.district} />
                  <Detail label="State" value={selected.flat_id?.state} />
                  <Detail label="Pincode" value={selected.flat_id?.pincode} />
                  <Detail label="Landmark" value={selected.flat_id?.landmark} />
                </div>
              </div>
              <div style={cs.section}>
                <p style={cs.sectionTitle}><FiUser size={13} style={{ marginRight: 6 }} />People</p>
                <div style={cs.grid}>
                  <Detail label="Owner" value={selected.owner?.name} />
                  <Detail label="Tenant" value={selected.tenant_id?.name} />
                  <Detail label="Owner Email" value={selected.owner?.email} />
                  <Detail label="Tenant Email" value={selected.tenant_id?.email} />
                  <Detail label="Owner Phone" value={selected.owner?.phone ? (selected.owner.phone.startsWith("+") ? selected.owner.phone : `+91 ${selected.owner.phone}`) : null} />
                  <Detail label="Tenant Phone" value={selected.tenant_id?.phone ? (selected.tenant_id.phone.startsWith("+") ? selected.tenant_id.phone : `+91 ${selected.tenant_id.phone}`) : null} />
                </div>
              </div>
              <div style={cs.section}>
                <p style={cs.sectionTitle}><FiInfo size={13} style={{ marginRight: 6 }} />Booking Info</p>
                <div style={cs.grid}>
                  <Detail label="Date" value={new Date(selected.createdAt).toLocaleDateString()} />
                  <Detail label="Owner Booking" value={selected.owner?.bookingRestricted ? "Restricted" : "Allowed"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={cs.delOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={cs.popup} onClick={(e) => e.stopPropagation()}>
            <button style={cs.popupCloseBtn} onClick={() => setDeleteTarget(null)}><FiX size={16} /></button>
            <div style={cs.iconWrap}><FiAlertTriangle size={28} color="#e74c3c" /></div>
            <h3 style={cs.popupTitle}>Confirm Delete</h3>
            <p style={cs.popupMsg}>Delete this booking? This cannot be undone.</p>
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
  filters: { display: "flex", gap: "10px", flexWrap: "wrap" },
  search: { padding: "10px 16px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontSize: "0.92rem", minWidth: "220px" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", fontSize: "0.92rem" },
  badge: { display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600", whiteSpace: "nowrap", alignSelf: "flex-start" },
  actions: { display: "flex", gap: "6px", flexWrap: "nowrap", alignItems: "center" },
  blockBtn: { display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600", whiteSpace: "nowrap", minWidth: "80px", justifyContent: "center" },
  approveBtn: { padding: "4px 10px", background: "#eafaf1", color: "#27ae60", border: "1px solid #a9dfbf", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },
  rejectBtn: { padding: "4px 10px", background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },
  resetBtn: { padding: "4px 10px", background: "#f0f2f5", color: "#555", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },
  detailsBtn: { display: "inline-flex", alignItems: "center", padding: "5px 12px", background: "#eaf4fb", color: "#2980b9", border: "1px solid #aed6f1", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600", whiteSpace: "nowrap" },
  delBtn: { display: "inline-flex", alignItems: "center", padding: "5px 12px", background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600", whiteSpace: "nowrap" },
  btn: { padding: "5px 14px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal: { background: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", position: "relative" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#2c3e50" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" },
  sections: { display: "flex", flexDirection: "column", gap: "20px" },
  section: { background: "#f8f9fa", borderRadius: "10px", padding: "16px" },
  sectionTitle: { margin: "0 0 12px", fontSize: "0.8rem", fontWeight: "700", color: "#2c3e50", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  delOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" },
  popup: { background: "#fff", borderRadius: "14px", padding: "32px 28px 24px", width: "100%", maxWidth: "380px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", textAlign: "center", position: "relative" },
  popupCloseBtn: { position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" },
  iconWrap: { width: "56px", height: "56px", borderRadius: "50%", background: "#fdf0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  popupTitle: { margin: "0 0 8px", fontSize: "1.1rem", fontWeight: "700", color: "#2c3e50" },
  popupMsg: { margin: "0 0 24px", fontSize: "0.9rem", color: "#666", lineHeight: 1.5 },
  popupActions: { display: "flex", gap: "10px", justifyContent: "center" },
  cancelBtn: { padding: "10px 24px", background: "#f0f2f5", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "600", color: "#555" },
  confirmBtn: { padding: "10px 24px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "700", color: "#fff" },
};

function Detail({ label, value }) {
  return (
    <div>
      <p style={{ margin: "0 0 2px", fontSize: "0.72rem", fontWeight: "700", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "0.88rem", color: value ? "#2c3e50" : "#ccc" }}>{value || "—"}</p>
    </div>
  );
}
