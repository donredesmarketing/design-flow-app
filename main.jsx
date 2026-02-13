import React, { useState, useMemo, useEffect } from 'react';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Image as ImageIcon, 
  Trash2, 
  User, 
  Palette,
  Clock,
  Download,
  LogOut,
  Mail,
  Archive,
  Inbox,
  ArrowUpRight,
  HardDrive,
  Cloud,
  Settings,
  Bell,
  Send
} from 'lucide-react';

// Datos iniciales
const MOCK_DESIGNS = [
  {
    id: 1,
    title: "Logo Redesign - Opción A",
    description: "Versión minimalista con paleta de colores corporativa.",
    status: "approved", 
    imageUrl: "https://images.unsplash.com/photo-1626785774573-4b7993125651?auto=format&fit=crop&q=80&w=800",
    date: "2023-10-25",
    feedback: "¡Me encanta esta opción!",
    fileName: "logo_v1.png",
    fileSize: 12.5,
    clientEmail: "cliente@tech.com",
    isArchived: false,
    driveLinked: true
  }
];

export default function App() {
  const [designs, setDesigns] = useState(MOCK_DESIGNS);
  const [viewMode, setViewMode] = useState('designer');
  const [designerTab, setDesignerTab] = useState('active');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  
  // Configuración de notificaciones
  const [adminEmail, setAdminEmail] = useState("tu-correo@diseno.com");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationLog, setNotificationLog] = useState([]);

  const STORAGE_LIMIT = 2000; 

  const usedStorage = useMemo(() => {
    return designs.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
  }, [designs]);

  const storagePercentage = Math.min((usedStorage / STORAGE_LIMIT) * 100, 100);

  // Estados de sesión y modales
  const [clientSession, setClientSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [newDesign, setNewDesign] = useState({ title: '', description: '', clientEmail: '', file: null, previewUrl: null });

  const filteredDesigns = useMemo(() => {
    if (viewMode === 'designer') {
      return designs.filter(d => designerTab === 'archived' ? d.isArchived : !d.isArchived);
    }
    if (viewMode === 'client' && clientSession) {
      // Normalizamos correos para evitar errores de mayúsculas/espacios
      return designs.filter(d => d.clientEmail.toLowerCase().trim() === clientSession.toLowerCase().trim() && !d.isArchived);
    }
    return [];
  }, [designs, viewMode, clientSession, designerTab]);

  const handleConnectDrive = () => {
    setIsDriveConnected(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const simulatedSize = Math.floor(Math.random() * 50) + 10;
      setNewDesign({ ...newDesign, file, previewUrl: url, fileName: file.name, fileSize: simulatedSize });
    }
  };

  // Simulación de envío de correos
  const sendEmailNotifications = (design, action = "new") => {
    let logs = [];
    if (action === "new") {
      logs = [
        `📧 Correo enviado a CLIENTE (${design.clientEmail}): "Tienes una nueva propuesta: ${design.title}"`,
        `📧 Correo enviado a TI (${adminEmail}): "Entrega confirmada para ${design.clientEmail}"`
      ];
    } else {
      logs = [
        `📧 Correo enviado a TI (${adminEmail}): "El cliente ${design.clientEmail} ha ${action} el diseño ${design.title}"`
      ];
    }
    setNotificationLog(prev => [...logs, ...prev].slice(0, 5));
  };

  const handleSubmitDesign = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      ...newDesign,
      status: 'pending',
      imageUrl: newDesign.previewUrl || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800",
      date: new Date().toISOString().split('T')[0],
      feedback: "",
      isArchived: false,
      driveLinked: isDriveConnected 
    };

    setDesigns([newEntry, ...designs]);
    sendEmailNotifications(newEntry);
    setIsUploadModalOpen(false);
    setNewDesign({ title: '', description: '', clientEmail: '', file: null, previewUrl: null });
  };

  const handleUpdateStatus = (id, newStatus) => {
    const design = designs.find(d => d.id === id);
    setDesigns(designs.map(d => d.id === id ? { ...d, status: newStatus, feedback: feedbackText } : d));
    sendEmailNotifications(design, newStatus === 'approved' ? 'aprobado' : 'rechazado');
    setActiveFeedbackId(null);
    setFeedbackText("");
  };

  const deleteDesign = (id) => {
    setDesigns(designs.filter(d => d.id !== id));
  };

  const toggleArchive = (id) => {
    setDesigns(designs.map(d => d.id === id ? { ...d, isArchived: !d.isArchived } : d));
  };

  if (viewMode === 'client' && !clientSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <User className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Portal Clientes</h2>
          <p className="text-slate-500 text-sm mb-6">Ingresa tu correo para ver tus diseños.</p>
          <input 
            className="w-full px-4 py-3 bg-slate-100 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="correo@ejemplo.com"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <button 
            onClick={() => setClientSession(loginEmail)}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Ver Mis Diseños
          </button>
          <button onClick={() => setViewMode('designer')} className="mt-6 text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors">Volver a Diseñador</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl"><Palette className="text-white" size={24} /></div>
          <span className="text-xl font-black tracking-tight text-slate-900">DESIGN<span className="text-indigo-600">FLOW</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setViewMode('designer')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'designer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Diseñador</button>
            <button onClick={() => setViewMode('client')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'client' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Cliente</button>
          </div>
          {viewMode === 'client' && (
            <button onClick={() => setClientSession(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full p-6 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar de control para Diseñador */}
          {viewMode === 'designer' && (
            <aside className="lg:w-80 shrink-0 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-100"
                >
                  <Upload size={20} /> Nueva Entrega
                </button>

                {/* Sección de Notificaciones */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ajustes Correo</span>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <Settings size={16} />
                    </button>
                  </div>
                  
                  {isSettingsOpen ? (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold text-slate-500">Mi Correo de Notificaciones:</label>
                      <input 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                      />
                      <p className="text-[9px] text-slate-400">Aquí recibirás avisos de cada nueva entrega realizada.</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <Bell size={14} className="text-indigo-500" />
                      <span className="truncate">{adminEmail}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                    <span>Almacenamiento</span>
                    <Cloud size={14} className={isDriveConnected ? 'text-green-500' : 'text-slate-300'} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{usedStorage.toFixed(1)} MB</span>
                      <span className="text-slate-400">{STORAGE_LIMIT} MB</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${storagePercentage > 85 ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${storagePercentage}%` }}
                      />
                    </div>
                  </div>

                  {!isDriveConnected && (
                    <button 
                      onClick={handleConnectDrive}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-2xl text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all"
                    >
                      <HardDrive size={14} /> Conectar Google Drive
                    </button>
                  )}
                </div>
              </div>

              {/* Historial de Notificaciones Recientes */}
              {notificationLog.length > 0 && (
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Bell size={12} /> Actividad de Correos
                  </h4>
                  <div className="space-y-3">
                    {notificationLog.map((log, i) => (
                      <div key={i} className="text-[10px] leading-relaxed border-l border-indigo-500/30 pl-3 py-1 text-slate-300 italic">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <button onClick={() => setDesignerTab('active')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${designerTab === 'active' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Inbox size={20} /> Propuestas Activas
                </button>
                <button onClick={() => setDesignerTab('archived')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${designerTab === 'archived' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Archive size={20} /> Archivados
                </button>
              </div>
            </aside>
          )}

          {/* Contenido Principal */}
          <div className="flex-1">
            <header className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  {viewMode === 'designer' ? (designerTab === 'active' ? 'Panel de Control' : 'Archivo Histórico') : 'Mis Propuestas'}
                </h1>
                <p className="text-slate-500 mt-2">
                  {viewMode === 'designer' ? 'Gestiona los entregables y notifica automáticamente a tus clientes.' : `Bienvenido ${clientSession}, aquí están tus diseños pendientes.`}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredDesigns.map(design => (
                <div key={design.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    <img src={design.imageUrl} alt={design.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    {/* Indicadores flotantes */}
                    <div className="absolute top-5 left-5 flex gap-2">
                      {design.driveLinked && (
                        <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl shadow-sm text-indigo-600" title="Sincronizado con Drive">
                          <Cloud size={18} fill="currentColor" />
                        </div>
                      )}
                    </div>

                    <div className="absolute top-5 right-5">
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                        design.status === 'approved' ? 'bg-green-500 text-white' : 
                        design.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
                      }`}>
                        {design.status === 'approved' ? 'Aprobado' : design.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{design.title}</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Mail size={12} className="text-indigo-400" /> {design.clientEmail}
                        </div>
                      </div>
                      
                      {viewMode === 'designer' && (
                        <div className="flex gap-2">
                          <button onClick={() => toggleArchive(design.id)} className="p-2.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-all">
                            {design.isArchived ? <ArrowUpRight size={18} /> : <Archive size={18} />}
                          </button>
                          <button onClick={() => deleteDesign(design.id)} className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 rounded-xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">{design.description}</p>

                    {/* Feedback del cliente si existe */}
                    {design.feedback && (
                      <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                        <MessageSquare size={18} className="text-indigo-500 shrink-0 mt-1" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Feedback del Cliente</p>
                          <p className="text-xs text-indigo-900 font-medium italic">"{design.feedback}"</p>
                        </div>
                      </div>
                    )}

                    {/* Acciones del Cliente */}
                    {viewMode === 'client' && design.status === 'pending' && (
                      <div className="mt-auto space-y-4">
                        {activeFeedbackId === design.id ? (
                          <div className="animate-in slide-in-from-bottom-2 duration-300">
                            <textarea 
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              placeholder="Escribe tus comentarios o cambios necesarios..."
                              rows="3"
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                            />
                            <div className="flex gap-2 mt-2">
                              <button 
                                onClick={() => handleUpdateStatus(design.id, 'rejected')}
                                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                              >
                                <XCircle size={14} /> Enviar Rechazo
                              </button>
                              <button 
                                onClick={() => setActiveFeedbackId(null)}
                                className="px-4 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button 
                              onClick={() => {
                                setFeedbackText("¡Diseño aprobado! Excelente trabajo.");
                                handleUpdateStatus(design.id, 'approved');
                              }}
                              className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                            >
                              <CheckCircle size={16} /> Aprobar
                            </button>
                            <button 
                              onClick={() => setActiveFeedbackId(design.id)}
                              className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:border-red-200 hover:text-red-500 transition-all"
                            >
                              <MessageSquare size={16} /> Solicitar Cambios
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} /> {design.date}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Download size={10} /> {design.fileSize} MB
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredDesigns.length === 0 && (
                <div className="col-span-full py-24 bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                  <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Inbox className="text-slate-300" size={40} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl">Sin elementos</h3>
                  <p className="text-slate-400 mt-2">Todo está organizado por ahora.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Subida */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nueva Entrega</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest">
                    <Bell size={10} /> Auto-Notificar
                  </span>
                  {isDriveConnected && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                      <Cloud size={10} /> Drive Sync
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="bg-white p-3 rounded-full shadow-md text-slate-400 hover:text-red-500 transition-all active:scale-90"><XCircle size={28} /></button>
            </div>
            
            <form onSubmit={handleSubmitDesign} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email del Cliente</label>
                  <input required type="email" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 border border-transparent focus:border-indigo-300 transition-all font-medium" placeholder="cliente@ejemplo.com" value={newDesign.clientEmail} onChange={(e) => setNewDesign({...newDesign, clientEmail: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre del Proyecto</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 border border-transparent focus:border-indigo-300 transition-all font-medium" placeholder="Ej: Logo Final V2" value={newDesign.title} onChange={(e) => setNewDesign({...newDesign, title: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Breve Descripción</label>
                <textarea className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 border border-transparent focus:border-indigo-300 transition-all font-medium resize-none" rows="2" placeholder="Notas sobre esta versión..." value={newDesign.description} onChange={(e) => setNewDesign({...newDesign, description: e.target.value})} />
              </div>

              <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 text-center hover:bg-slate-50 transition-all cursor-pointer relative group">
                {newDesign.previewUrl ? (
                  <div className="flex items-center justify-center gap-6 animate-in fade-in zoom-in-90">
                    <img src={newDesign.previewUrl} className="w-32 h-32 object-cover rounded-[2rem] shadow-xl border-4 border-white" />
                    <div className="text-left">
                      <p className="font-black text-slate-900 truncate max-w-[200px]">{newDesign.fileName}</p>
                      <p className="text-sm text-indigo-600 font-bold bg-indigo-50 inline-block px-2 py-1 rounded-lg mt-1">{newDesign.fileSize} MB</p>
                      <button type="button" onClick={() => setNewDesign({...newDesign, file: null, previewUrl: null})} className="block mt-2 text-xs text-red-500 font-bold hover:underline">Cambiar archivo</button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="bg-indigo-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="text-white" size={32} />
                    </div>
                    <span className="font-black text-slate-900 text-lg">Subir Archivo de Diseño</span>
                    <p className="text-slate-400 text-xs mt-1 font-medium">PNG, JPG o SVG (Máx. 50MB)</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-4 border border-amber-100">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Bell size={20} /></div>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Al confirmar, se enviará un correo de notificación a <span className="font-bold underline">{newDesign.clientEmail || 'el cliente'}</span> y una copia a tu dirección personal <span className="font-bold underline">{adminEmail}</span>.
                </p>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                Confirmar y Notificar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
