import React, { useState, useMemo, useEffect } from 'react';
import { 
  Upload, CheckCircle, XCircle, MessageSquare, Image as ImageIcon, 
  Trash2, User, Palette, Clock, Download, LogOut, Mail, Archive, 
  Inbox, Bell, Users, Plus, Edit, Settings, HardDrive
} from 'lucide-react';

// URL de tu API en Hostinger. Quitamos la barra inicial para evitar errores de parseo en el entorno
const API_URL = "api.php"; 
const ADMIN_MASTER_EMAIL = "donredesmarketing@gmail.com";

export default function App() {
  const [designs, setDesigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState('designer'); 
  const [designerTab, setDesignerTab] = useState('active'); 
  const [notificationLog, setNotificationLog] = useState([]);
  const [clientSession, setClientSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeFeedbackId, setActiveFeedbackId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  
  const [newDesign, setNewDesign] = useState({ title: '', description: '', clientEmail: '', file: null, previewUrl: null });
  const [userForm, setUserForm] = useState({ name: '', company: '', email: '', password: '', role: 'client' });

  // 1. Cargar datos iniciales desde el servidor MySQL
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Polling cada 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Usamos rutas relativas sin la barra inicial para máxima compatibilidad
      const [resUsers, resDesigns] = await Promise.all([
        fetch(`${API_URL}?action=get_users`),
        fetch(`${API_URL}?action=get_designs`)
      ]);
      
      if (!resUsers.ok || !resDesigns.ok) throw new Error("Error en la respuesta del servidor");
      
      const dataUsers = await resUsers.json();
      const dataDesigns = await resDesigns.json();
      
      setUsers(Array.isArray(dataUsers) ? dataUsers : []);
      setDesigns(Array.isArray(dataDesigns) ? dataDesigns : []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  const STORAGE_LIMIT = 15000; 
  const usedStorage = useMemo(() => designs.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0), [designs]);
  const storagePercentage = Math.min((usedStorage / STORAGE_LIMIT) * 100, 100);

  const filteredDesigns = useMemo(() => {
    if (viewMode === 'designer') return designs.filter(d => designerTab === 'archived' ? d.is_archived == 1 : d.is_archived == 0);
    if (viewMode === 'client' && clientSession) {
      const sessionEmail = String(clientSession).toLowerCase().trim();
      return designs.filter(d => String(d.client_email || '').toLowerCase().trim() === sessionEmail && d.is_archived == 0);
    }
    return [];
  }, [designs, viewMode, clientSession, designerTab]);

  // --- HANDLERS ---

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}?action=save_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser ? { ...userForm, id: editingUser.id } : userForm)
      });
      if (response.ok) {
        setIsUserModalOpen(false);
        setEditingUser(null);
        setUserForm({ name: '', company: '', email: '', password: '', role: 'client' });
        fetchData();
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
      try {
        await fetch(`${API_URL}?action=delete_user&id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const handleSubmitDesign = async (e) => {
    e.preventDefault();
    const designData = {
      title: newDesign.title,
      description: newDesign.description,
      clientEmail: newDesign.clientEmail,
      imageUrl: newDesign.previewUrl || "https://images.unsplash.com/photo-1557683316-973673baf926",
      fileSize: 15.5
    };

    try {
      await fetch(`${API_URL}?action=save_design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(designData)
      });
      setIsUploadModalOpen(false);
      setNewDesign({ title: '', description: '', clientEmail: '', file: null, previewUrl: null });
      fetchData();
      setNotificationLog(prev => [`📧 Notificación enviada a ${designData.clientEmail}`, ...prev].slice(0, 5));
    } catch (error) {
      console.error("Error al subir diseño:", error);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await fetch(`${API_URL}?action=update_design_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, feedback: feedbackText })
      });
      setActiveFeedbackId(null);
      setFeedbackText("");
      fetchData();
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };

  if (viewMode === 'client' && !clientSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center border border-slate-100">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100"><User className="text-white" size={32} /></div>
          <h2 className="text-2xl font-black mb-1 text-slate-900 tracking-tight uppercase">Don Redes - Clientes</h2>
          <p className="text-slate-500 text-sm mb-8">Ingresa tu email para ver tus diseños.</p>
          <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="correo@empresa.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          <button onClick={() => setClientSession(loginEmail)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-xs">Acceder</button>
          <button onClick={() => setViewMode('designer')} className="mt-8 text-[10px] text-slate-400 hover:text-indigo-600 font-black uppercase tracking-[0.2em]">Panel Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg"><Palette className="text-white" size={24} /></div>
          <span className="text-xl font-black tracking-tighter uppercase">DonRedes<span className="text-indigo-600 font-light">Marketing</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => { setViewMode('designer'); setDesignerTab('active'); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'designer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Estudio</button>
            <button onClick={() => setViewMode('client')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'client' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Cliente</button>
          </div>
          {viewMode === 'client' && <button onClick={() => setClientSession(null)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-xl"><LogOut size={20} /></button>}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full p-6 lg:p-10 flex-1">
        <div className="flex flex-col lg:flex-row gap-10">
          {viewMode === 'designer' && (
            <aside className="lg:w-72 shrink-0 space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                <button onClick={() => setIsUploadModalOpen(true)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest"><Upload size={18} /> Nueva Entrega</button>
                <div className="pt-4 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Navegación</p>
                  <button onClick={() => setDesignerTab('active')} className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm transition-all ${designerTab === 'active' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}><Inbox size={18} /> Entregas</button>
                  <button onClick={() => setDesignerTab('users')} className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm transition-all ${designerTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18} /> Usuarios</button>
                  <button onClick={() => setDesignerTab('archived')} className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm transition-all ${designerTab === 'archived' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}><Archive size={18} /> Archivo</button>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2 flex items-center gap-2"><HardDrive size={10} /> Servidor Local</p>
                  <div className="px-2 mb-3 truncate text-[9px] font-bold text-indigo-500 bg-indigo-50 py-1.5 rounded-lg border border-indigo-100">{ADMIN_MASTER_EMAIL}</div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${storagePercentage}%` }} /></div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400"><span>{usedStorage.toFixed(1)} MB</span><span>15 GB</span></div>
                </div>
              </div>
            </aside>
          )}

          <main className="flex-1">
            {designerTab === 'users' && viewMode === 'designer' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                  <div><h2 className="text-3xl font-black tracking-tight">Usuarios MySQL</h2><p className="text-slate-500 font-medium">Gestión desde tu base de datos de Hostinger.</p></div>
                  <button onClick={() => { setEditingUser(null); setUserForm({ name: '', company: '', email: '', password: '', role: 'client' }); setIsUserModalOpen(true); }} className="bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center gap-2"><Plus size={18} /> Crear Usuario</button>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
                        <th className="px-8 py-6">Usuario</th>
                        <th className="px-8 py-6">Email</th>
                        <th className="px-8 py-6">Rol</th>
                        <th className="px-8 py-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${u.role === 'designer' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{String(u.name || '').charAt(0)}</div>
                              <div><p className="font-bold text-slate-900 leading-tight">{u.name}</p><p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{u.company}</p></div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-semibold text-slate-600">{u.email}</td>
                          <td className="px-8 py-6"><span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${u.role === 'designer' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>{u.role === 'designer' ? 'Admin' : 'Cliente'}</span></td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingUser(u); setUserForm(u); setIsUserModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-all"><Edit size={18} /></button>
                              <button onClick={() => deleteUser(u.id)} className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                  <h1 className="text-4xl font-black tracking-tight">{viewMode === 'designer' ? 'Entregas en Servidor' : 'Mis Propuestas'}</h1>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {filteredDesigns.map(design => (
                    <div key={design.id} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group">
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img src={design.image_url} alt={design.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute top-6 right-6"><span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-xl ${design.status === 'approved' ? 'bg-green-500 text-white' : design.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'}`}>{design.status}</span></div>
                      </div>
                      <div className="p-10 flex-1 flex flex-col">
                        <h3 className="text-2xl font-black mb-1">{design.title}</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 tracking-tight"><Mail size={14} className="text-indigo-400" /> {design.client_email}</div>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">{design.description}</p>
                        {design.feedback && <div className="mb-8 p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100 italic text-xs text-indigo-900 font-bold leading-relaxed shadow-inner">"{design.feedback}"</div>}
                        {viewMode === 'client' && design.status === 'pending' && (
                          <div className="mt-auto pt-8 border-t border-slate-100 flex gap-4">
                            <button onClick={() => handleUpdateStatus(design.id, 'approved')} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 transition-all hover:bg-green-600">Aprobar</button>
                            <button onClick={() => setActiveFeedbackId(design.id)} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cambios</button>
                          </div>
                        )}
                        {activeFeedbackId === design.id && (
                          <div className="mt-4 animate-in slide-in-from-top-4">
                            <textarea className="w-full p-5 bg-slate-50 rounded-[1.5rem] text-sm border-2 border-slate-100 outline-none focus:ring-2 focus:ring-red-500 transition-all mb-3 resize-none font-medium" rows="3" placeholder="Describe los cambios..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                            <div className="flex gap-2">
                                <button onClick={() => handleUpdateStatus(design.id, 'rejected')} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100">Enviar</button>
                                <button onClick={() => setActiveFeedbackId(null)} className="px-5 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold">X</button>
                            </div>
                          </div>
                        )}
                        <div className="mt-auto pt-6 flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-t border-slate-50">
                          <span className="flex items-center gap-1.5 pt-4"><Clock size={12} /> {design.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredDesigns.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-100/30 border-2 border-dashed border-slate-200 rounded-[3rem] text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                      No se encontraron registros en esta sección
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL USUARIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tight">{editingUser ? 'Editar' : 'Nuevo'} Usuario</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-red-500 p-2"><XCircle size={28} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-10 space-y-5">
              <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Nombre completo" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} />
              <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Empresa" value={userForm.company} onChange={(e) => setUserForm({...userForm, company: e.target.value})} />
              <input required type="email" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} />
              <input required type="password" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Contraseña" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} />
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-[1.5rem]">
                <button type="button" onClick={() => setUserForm({...userForm, role: 'designer'})} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${userForm.role === 'designer' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}>Admin</button>
                <button type="button" onClick={() => setUserForm({...userForm, role: 'client'})} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${userForm.role === 'client' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}>Cliente</button>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] mt-4 shadow-2xl transition-all hover:bg-slate-800">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENTREGA */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-3xl font-black tracking-tight">Nueva Entrega</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-red-500 p-2"><XCircle size={32} /></button>
            </div>
            <form onSubmit={handleSubmitDesign} className="p-12 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <input required type="email" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Email Cliente" value={newDesign.clientEmail} onChange={(e) => setNewDesign({...newDesign, clientEmail: e.target.value})} />
                <input required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Proyecto" value={newDesign.title} onChange={(e) => setNewDesign({...newDesign, title: e.target.value})} />
              </div>
              <textarea className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-sm" rows="3" placeholder="Descripción de la entrega..." value={newDesign.description} onChange={(e) => setNewDesign({...newDesign, description: e.target.value})} />
              <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-12 text-center hover:bg-slate-50 transition-all cursor-pointer relative group">
                {newDesign.previewUrl ? (
                  <div className="relative inline-block">
                    <img src={newDesign.previewUrl} className="w-40 h-40 object-cover rounded-[2.5rem] mx-auto shadow-2xl border-4 border-white" />
                    <button type="button" onClick={() => setNewDesign({...newDesign, previewUrl: null})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><XCircle size={20}/></button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="bg-indigo-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100"><ImageIcon className="text-white" size={32} /></div>
                    <p className="font-black text-slate-900 text-lg uppercase tracking-tight">Subir Diseño</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">Haz clic para seleccionar archivo</p>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if(file) setNewDesign({...newDesign, previewUrl: URL.createObjectURL(file), fileName: file.name}) }} />
                  </label>
                )}
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95">Publicar en Servidor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
