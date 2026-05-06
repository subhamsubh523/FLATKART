import { useState, useEffect } from "react";
import AdminAPI from "../adminApi";
import { FiAlertTriangle, FiX, FiUserPlus, FiSave, FiEye, FiEyeOff, FiEdit2, FiTrash2, FiShield, FiUsers, FiHome, FiBookmark, FiAlertCircle, FiCheckCircle, FiActivity } from "react-icons/fi";

const SECTIONS = [
  { key: "owners",   label: "Owners",   icon: <FiUsers size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />,    ops: ["read", "update", "delete"] },
  { key: "tenants",  label: "Tenants",  icon: <FiShield size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />,   ops: ["read", "update", "delete"] },
  { key: "flats",    label: "Flats",    icon: <FiHome size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />,     ops: ["read", "update", "delete"] },
  { key: "bookings", label: "Bookings", icon: <FiBookmark size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />, ops: ["read", "update", "delete"] },
];

const OP_LABELS = { read: "View", create: "Create", update: "Edit", delete: "Delete" };
const OP_COLORS = { read: "#3498db", create: "#27ae60", update: "#f39c12", delete: "#e74c3c" };

const perm = (section, op) => `${section}:${op}`;
const allPerms = SECTIONS.flatMap((s) => s.ops.map((op) => perm(s.key, op)));

const EMPTY_FORM = { name: "", emailPrefix: "", password: "", permissions: [] };

export default function AdminModerators() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMod, setEditMod] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activityMod, setActivityMod] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    AdminAPI.get("/moderators").then(({ data }) => { setMods(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditMod(null); setForm(EMPTY_FORM); setError(""); setShowPass(false); setShowModal(true); };
  const openEdit = (mod) => { setEditMod(mod); setForm({ name: mod.name, emailPrefix: (mod.email || "").replace("@flatkart.com", ""), password: "", permissions: [...(mod.permissions || [])] }); setError(""); setShowPass(false); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setError(""); };

  const hasPerm = (p) => form.permissions.includes(p);

  const togglePerm = (p) => setForm((f) => ({
    ...f,
    permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
  }));

  const toggleSection = (section) => {
    const sectionPerms = SECTIONS.find((s) => s.key === section).ops.map((op) => perm(section, op));
    const allOn = sectionPerms.every((p) => form.permissions.includes(p));
    setForm((f) => ({
      ...f,
      permissions: allOn
        ? f.permissions.filter((p) => !sectionPerms.includes(p))
        : [...new Set([...f.permissions, ...sectionPerms])],
    }));
  };

  const isSectionFull = (section) => SECTIONS.find((s) => s.key === section).ops.every((op) => hasPerm(perm(section, op)));
  const isSectionPartial = (section) => SECTIONS.find((s) => s.key === section).ops.some((op) => hasPerm(perm(section, op))) && !isSectionFull(section);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editMod) {
        const payload = { name: form.name, email: `${form.emailPrefix}@flatkart.com`, permissions: form.permissions };
        if (form.password) payload.password = form.password;
        const { data } = await AdminAPI.put(`/moderators/${editMod._id}`, payload);
        setMods((prev) => prev.map((m) => m._id === editMod._id ? data : m));
      } else {
        if (!form.password) { setError("Password is required"); setSaving(false); return; }
        const { data } = await AdminAPI.post("/moderators", { ...form, email: `${form.emailPrefix}@flatkart.com` });
        setMods((prev) => [data, ...prev]);
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save moderator");
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (id) => {
    const { data } = await AdminAPI.patch(`/moderators/${id}/toggle`);
    setMods((prev) => prev.map((m) => m._id === id ? { ...m, blocked: data.blocked } : m));
  };

  const remove = async (id) => {
    await AdminAPI.delete(`/moderators/${id}`);
    setMods((prev) => prev.filter((m) => m._id !== id));
    setDeleteTarget(null);
  };

  const viewActivity = async (mod) => {
    setActivityMod(mod);
    setLoadingActivity(true);
    try {
      const { data } = await AdminAPI.get(`/moderators/${mod._id}/activity`);
      setActivityData(data.logs || []);
    } catch (err) {
      setActivityData([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h2 style={s.title}><FiShield size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />Moderators</h2>
          <p style={s.sub}>{mods.length} moderator{mods.length !== 1 ? "s" : ""}</p>
        </div>
        <button style={s.addBtn} onClick={openAdd}><FiUserPlus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Add New Moderator</button>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #e0e0e0", borderTop: "3px solid #2c3e50", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Loading...</span>
        </div>
      )
        : mods.length === 0 ? (
          <div style={s.empty}>
            <FiShield size={56} color="#bdc3c7" />
            <p style={{ color: "#888", margin: "12px 0 0" }}>No moderators yet. Add one to delegate admin tasks.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {mods.map((mod) => (
              <div key={mod._id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.avatar}>{mod.name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.modName}>{mod.name}</p>
                    <p style={s.modEmail}>{mod.email}</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                      <span style={s.permBadge}>{mod.permissions?.length || 0} Permission{mod.permissions?.length !== 1 ? "s" : ""}</span>
                      {mod.blocked
                        ? <span style={s.blockedBadge}><FiAlertCircle size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />Disabled</span>
                        : <span style={s.enabledBadge}><FiCheckCircle size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />Enabled</span>
                      }
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                      <button style={s.activityBtn} onClick={() => viewActivity(mod)}><FiActivity size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />View Activity</button>
                      <button style={s.editBtn} onClick={() => openEdit(mod)}><FiEdit2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Edit</button>
                      <button style={s.delBtn} onClick={() => setDeleteTarget(mod)}><FiTrash2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Delete</button>
                    </div>
                  </div>
                </div>

                <div>
                  <p style={s.permTitle}>Access Permissions</p>
                  <div style={s.matrixWrap}>
                    {SECTIONS.map((sec) => {
                      const grantedOps = sec.ops.filter((op) => mod.permissions?.includes(perm(sec.key, op)));
                      if (!grantedOps.length) return null;
                      return (
                        <div key={sec.key} style={s.matrixRow}>
                          <span style={s.matrixSection}>{sec.label}</span>
                          <div style={s.matrixOps}>
                            {grantedOps.map((op) => (
                              <span key={op} style={{ ...s.opTag, background: `${OP_COLORS[op]}18`, color: OP_COLORS[op], border: `1px solid ${OP_COLORS[op]}44` }}>
                                {OP_LABELS[op]}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {!mod.permissions?.length && <p style={{ color: "#ccc", fontSize: "0.82rem", margin: 0 }}>No permissions assigned</p>}
                  </div>
                </div>

                <div style={s.cardFooter}>
                  <p style={{ ...s.joined, margin: 0 }}>Added On: {new Date(mod.createdAt).toLocaleDateString()}</p>
                  <div style={s.switchWrap} onClick={() => toggleBlock(mod._id)} title={mod.blocked ? "Click to Enable" : "Click to Disable"}>
                    <div style={{ ...s.switchTrack, background: mod.blocked ? "#e74c3c" : "#1abc9c" }}>
                      <div style={{ ...s.switchKnob, transform: mod.blocked ? "translateX(2px)" : "translateX(22px)" }} />
                    </div>
                    <span style={{ ...s.switchLabel, color: mod.blocked ? "#e74c3c" : "#1abc9c" }}>
                      {mod.blocked ? "Disabled" : "Enabled"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {activityMod && (
        <div style={s.delOverlay} onClick={() => { setActivityMod(null); setActivityData(null); }}>
          <div style={{ ...s.modal, maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}><FiActivity size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />{activityMod.name} Activity Logs</h3>
              <button style={s.closeBtn} onClick={() => { setActivityMod(null); setActivityData(null); }}><FiX size={16} /></button>
            </div>
            {loadingActivity ? (
              <p style={{ textAlign: "center", color: "#888", padding: "32px 0" }}>Loading activity...</p>
            ) : activityData?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "60vh", overflowY: "auto" }}>
                {activityData.map((log) => (
                  <div key={log._id} style={s.logItem}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ ...s.logBadge, ...getActionStyle(log.action) }}>{formatAction(log.action)}</span>
                        <span style={s.logTarget}>{log.targetName || log.targetId}</span>
                      </div>
                      <span style={s.logTime}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    {log.details && <p style={s.logDetails}>{log.details}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                <FiActivity size={40} color="#ddd" style={{ marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: "0.9rem" }}>No activity recorded yet.</p>
                <p style={{ margin: "6px 0 0", fontSize: "0.8rem" }}>Actions performed by this moderator will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={s.delOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={s.popup} onClick={(e) => e.stopPropagation()}>
            <button style={s.popupClose} onClick={() => setDeleteTarget(null)}><FiX size={16} /></button>
            <div style={s.iconWrap}><FiAlertTriangle size={28} color="#e74c3c" /></div>
            <h3 style={s.popupTitle}>Confirm Delete</h3>
            <p style={s.popupMsg}>Delete moderator <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
            <div style={s.popupActions}>
              <button style={s.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button style={s.confirmBtn} onClick={() => remove(deleteTarget._id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{editMod ? <><FiEdit2 size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />Edit Moderator</> : <><FiUserPlus size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />Add Moderator</>}</h3>
              <button style={s.closeBtn} onClick={closeModal}><FiX size={16} /></button>
            </div>

            {error && <div style={s.errorBox}><FiAlertTriangle size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />{error}</div>}

            <form onSubmit={handleSave} style={s.form}>
              {/* Basic Info */}
              <div style={s.group}>
                <label style={s.label}>Full Name</label>
                <input style={s.input} placeholder="Enter name" value={form.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const capitalized = val.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
                    setForm({ ...form, name: capitalized });
                  }}
                  required />
              </div>

              {!editMod && (
                <>
                  <div style={s.group}>
                    <label style={s.label}>Moderator Address</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input style={{ ...s.input, paddingRight: "110px" }} type="text" placeholder="Moderator ID"
                        value={form.emailPrefix}
                        onChange={(e) => setForm({ ...form, emailPrefix: e.target.value })} required />
                      <span style={{ position: "absolute", right: "12px", fontSize: "0.82rem", color: "#2c3e50", fontWeight: "600", pointerEvents: "none", whiteSpace: "nowrap" }}>@flatkart.com</span>
                    </div>
                  </div>
                  <div style={s.group}>
                    <label style={s.label}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input style={{ ...s.input, paddingRight: "40px" }} type={showPass ? "text" : "password"}
                        placeholder="Password" value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
                        {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {editMod && (
                <>
                  <div style={s.group}>
                    <label style={s.label}>Email Address</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input style={{ ...s.input, paddingRight: "110px" }} type="text" placeholder="Moderator ID"
                        value={form.emailPrefix}
                        onChange={(e) => setForm({ ...form, emailPrefix: e.target.value })} required />
                      <span style={{ position: "absolute", right: "12px", fontSize: "0.82rem", color: "#2c3e50", fontWeight: "600", pointerEvents: "none", whiteSpace: "nowrap" }}>@flatkart.com</span>
                    </div>
                  </div>
                  <div style={s.group}>
                    <label style={s.label}>New Password <span style={{ color: "#aaa", fontWeight: "400" }}></span></label>
                    <div style={{ position: "relative" }}>
                      <input style={{ ...s.input, paddingRight: "40px" }} type={showPass ? "text" : "password"}
                        placeholder="Password" value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
                        {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Permission Matrix */}
              <div style={s.group}>
                <div style={s.permHeader}>
                  
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" style={s.selectAllBtn} onClick={() => setForm((f) => ({ ...f, permissions: allPerms }))}>All Access</button>
                    <button type="button" style={s.selectAllBtn} onClick={() => setForm((f) => ({ ...f, permissions: [] }))}>Clear All</button>
                  </div>
                </div>

                <div style={s.matrix}>
                  {/* Header row */}
                  <div style={s.matrixHeaderRow}>
                    <div style={s.matrixLabelCell}>Section</div>
                    {["read", "update", "delete"].map((op) => (
                      <div key={op} style={{ ...s.matrixHeaderCell, color: OP_COLORS[op] }}>{OP_LABELS[op]}</div>
                    ))}
                    <div style={s.matrixHeaderCell}>All</div>
                  </div>

                  {SECTIONS.map((sec) => (
                    <div key={sec.key} style={s.matrixDataRow}>
                      <div style={s.matrixLabelCell}><span style={{ display: "flex", alignItems: "center" }}>{sec.icon}{sec.label}</span></div>
                      {["read", "update", "delete"].map((op) => {
                        const p = perm(sec.key, op);
                        const supported = sec.ops.includes(op);
                        const checked = supported && hasPerm(p);
                        return (
                          <div key={op} style={s.matrixCell}>
                            {supported ? (
                              <div onClick={() => togglePerm(p)}
                                style={{ ...s.cb, background: checked ? OP_COLORS[op] : "#fff", border: `2px solid ${checked ? OP_COLORS[op] : "#ddd"}`, cursor: "pointer" }}>
                                {checked && <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: "700" }}>✓</span>}
                              </div>
                            ) : <span style={{ color: "#e0e0e0", fontSize: "0.8rem" }}>—</span>}
                          </div>
                        );
                      })}
                      {/* All toggle for this section */}
                      <div style={s.matrixCell}>
                        <div onClick={() => toggleSection(sec.key)}
                          style={{ ...s.cb, background: isSectionFull(sec.key) ? "#2c3e50" : isSectionPartial(sec.key) ? "#95a5a6" : "#fff", border: `2px solid ${isSectionFull(sec.key) || isSectionPartial(sec.key) ? "#2c3e50" : "#ddd"}`, cursor: "pointer" }}>
                          {(isSectionFull(sec.key) || isSectionPartial(sec.key)) && <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: "700" }}>{isSectionFull(sec.key) ? "✓" : "–"}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={s.permCount}>{form.permissions.length} permission{form.permissions.length !== 1 ? "s" : ""} selected</p>
              </div>

              <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} type="submit" disabled={saving}>
                {saving ? "Saving..." : editMod
                  ? <><FiSave size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Save Changes</>
                  : <><FiUserPlus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Add Moderator</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" },
  title: { margin: "0 0 4px", fontSize: "1.5rem", color: "#2c3e50", fontWeight: "700" },
  sub: { margin: 0, color: "#888", fontSize: "0.9rem" },
  addBtn: { padding: "10px 22px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.92rem" },
  empty: { textAlign: "center", padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" },
  card: { background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: "14px" },
  cardTop: { display: "flex", alignItems: "flex-start", gap: "12px" },
  avatar: { width: "44px", height: "44px", borderRadius: "50%", background: "#8e44ad", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "1.1rem", flexShrink: 0 },
  modName: { margin: 0, fontWeight: "700", fontSize: "0.95rem", color: "#2c3e50" },
  modEmail: { margin: "2px 0 0", fontSize: "0.8rem", color: "#888", wordBreak: "break-all" },
  cardActions: { display: "flex", gap: "8px", flexShrink: 0, alignItems: "center", marginLeft: "auto" },
  activityBtn: { padding: "5px 12px", background: "#f0f4ff", color: "#8e44ad", border: "1px solid #d7bde2", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600", display: "inline-flex", alignItems: "center" },
  editBtn: { padding: "5px 12px", background: "#eaf4fb", color: "#2980b9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },
  delBtn: { padding: "5px 10px", background: "#fdf0f0", color: "#e74c3c", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem" },
  blockedBadge: { display: "inline-block", background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "10px", padding: "1px 8px", fontSize: "0.72rem", fontWeight: "600", marginTop: "2px" },
  enabledBadge: { display: "inline-block", background: "#eafaf1", color: "#27ae60", border: "1px solid #a9dfbf", borderRadius: "10px", padding: "1px 8px", fontSize: "0.72rem", fontWeight: "600", marginTop: "2px" },
  permBadge: { display: "inline-block", background: "#f0f4ff", color: "#2980b9", border: "1px solid #c5d8f5", borderRadius: "10px", padding: "1px 8px", fontSize: "0.72rem", fontWeight: "600", marginTop: "4px", marginRight: "6px" },
  permTitle: { margin: "0 0 8px", fontSize: "0.78rem", fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" },
  matrixWrap: { display: "flex", flexDirection: "column", gap: "6px" },
  matrixRow: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  matrixSection: { fontSize: "0.8rem", color: "#555", fontWeight: "600", minWidth: "100px" },
  matrixOps: { display: "flex", gap: "4px", flexWrap: "wrap" },
  opTag: { padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "600" },
  joined: { margin: 0, fontSize: "0.75rem", color: "#bbb" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" },
  switchWrap: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" },
  switchTrack: { width: "44px", height: "24px", borderRadius: "12px", position: "relative", transition: "background 0.3s ease", flexShrink: 0 },
  switchKnob: { position: "absolute", top: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", transition: "transform 0.3s ease" },
  switchLabel: { fontSize: "0.78rem", fontWeight: "700", transition: "color 0.3s" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "560px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { margin: 0, fontSize: "1.1rem", color: "#2c3e50", fontWeight: "700" },
  closeBtn: { background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#888" },
  errorBox: { background: "#fdf0f0", color: "#e74c3c", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  group: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#444" },
  input: { padding: "10px 14px", fontSize: "0.97rem", borderRadius: "8px", border: "1.5px solid #e0e0e0", outline: "none", background: "#fafafa", width: "100%", boxSizing: "border-box" },
  permHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  selectAllBtn: { padding: "4px 12px", background: "#f0f2f5", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", color: "#555" },
  matrix: { border: "1px solid #e8e8e8", borderRadius: "10px", overflow: "hidden" },
  matrixHeaderRow: { display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 0.8fr", background: "#f8f9fa", borderBottom: "1px solid #e8e8e8" },
  matrixDataRow: { display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 0.8fr", borderBottom: "1px solid #f0f0f0" },
  matrixHeaderCell: { padding: "8px 6px", fontSize: "0.75rem", fontWeight: "700", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.3px" },
  matrixLabelCell: { padding: "10px 12px", fontSize: "0.82rem", fontWeight: "600", color: "#2c3e50", display: "flex", alignItems: "center" },
  matrixCell: { padding: "10px 6px", display: "flex", alignItems: "center", justifyContent: "center" },
  cb: { width: "18px", height: "18px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 },
  permCount: { margin: "8px 0 0", fontSize: "0.8rem", color: "#888", textAlign: "right" },
  delOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" },
  popup: { background: "#fff", borderRadius: "14px", padding: "32px 28px 24px", width: "100%", maxWidth: "380px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", textAlign: "center", position: "relative" },
  popupClose: { position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" },
  iconWrap: { width: "56px", height: "56px", borderRadius: "50%", background: "#fdf0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  popupTitle: { margin: "0 0 8px", fontSize: "1.1rem", fontWeight: "700", color: "#2c3e50" },
  popupMsg: { margin: "0 0 24px", fontSize: "0.9rem", color: "#666", lineHeight: 1.5 },
  popupActions: { display: "flex", gap: "10px", justifyContent: "center" },
  cancelBtn: { padding: "10px 24px", background: "#f0f2f5", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "600", color: "#555" },
  confirmBtn: { padding: "10px 24px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "700", color: "#fff" },
  saveBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px", background: "linear-gradient(135deg,#e74c3c,#c0392b)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.97rem", width: "100%" },
  activitySection: { background: "#f8f9fa", borderRadius: "10px", padding: "14px 16px" },
  activitySectionTitle: { margin: "0 0 12px", fontSize: "0.78rem", fontWeight: "700", color: "#2c3e50", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center" },
  activityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" },
  logItem: { background: "#f8f9fa", borderRadius: "10px", padding: "12px 14px", borderLeft: "3px solid #e0e0e0" },
  logBadge: { padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "700", whiteSpace: "nowrap" },
  logTarget: { fontSize: "0.85rem", fontWeight: "600", color: "#2c3e50" },
  logTime: { fontSize: "0.72rem", color: "#aaa", whiteSpace: "nowrap", flexShrink: 0 },
  logDetails: { margin: "6px 0 0", fontSize: "0.78rem", color: "#888" },
};

const ACTION_STYLES = {
  blocked_owner:            { background: "#fdf0f0", color: "#e74c3c", borderLeft: "3px solid #e74c3c" },
  unblocked_owner:          { background: "#eafaf1", color: "#27ae60", borderLeft: "3px solid #27ae60" },
  restricted_owner_booking: { background: "#fef9e7", color: "#f39c12", borderLeft: "3px solid #f39c12" },
  allowed_owner_booking:    { background: "#eafaf1", color: "#27ae60", borderLeft: "3px solid #27ae60" },
  deleted_owner:            { background: "#fdf0f0", color: "#e74c3c", borderLeft: "3px solid #e74c3c" },
  blocked_tenant:           { background: "#fdf0f0", color: "#e74c3c", borderLeft: "3px solid #e74c3c" },
  unblocked_tenant:         { background: "#eafaf1", color: "#27ae60", borderLeft: "3px solid #27ae60" },
  deleted_tenant:           { background: "#fdf0f0", color: "#e74c3c", borderLeft: "3px solid #e74c3c" },
  showed_flat:              { background: "#eafaf1", color: "#27ae60", borderLeft: "3px solid #27ae60" },
  hid_flat:                 { background: "#f0f2f5", color: "#888",    borderLeft: "3px solid #bbb" },
  deleted_flat:             { background: "#fdf0f0", color: "#e74c3c", borderLeft: "3px solid #e74c3c" },
  deleted_booking:          { background: "#fdf0f0", color: "#e74c3c", borderLeft: "3px solid #e74c3c" },
};

const ACTION_LABELS = {
  blocked_owner:            "Blocked Owner",
  unblocked_owner:          "Unblocked Owner",
  restricted_owner_booking: "Restricted Booking",
  allowed_owner_booking:    "Allowed Booking",
  deleted_owner:            "Deleted Owner",
  blocked_tenant:           "Blocked Tenant",
  unblocked_tenant:         "Unblocked Tenant",
  deleted_tenant:           "Deleted Tenant",
  showed_flat:              "Showed Flat",
  hid_flat:                 "Hid Flat",
  deleted_flat:             "Deleted Flat",
  deleted_booking:          "Deleted Booking",
};

function getActionStyle(action) {
  return ACTION_STYLES[action] || { background: "#f0f4ff", color: "#2980b9", borderLeft: "3px solid #2980b9" };
}

function formatAction(action) {
  return ACTION_LABELS[action] || action;
}
