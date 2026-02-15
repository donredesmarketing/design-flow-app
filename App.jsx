import React, { useState, useMemo } from 'react';
import {
  Upload, CheckCircle, XCircle, MessageSquare, Image as ImageIcon,
  User, Palette, LogOut, Mail, HardDrive, Settings, Bell
} from 'lucide-react';

// === CONFIGURACIÓN ===
// Cambia por tu endpoint real en Hostinger (ver send_email.php más abajo)
const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || "https://tudominio.com/send_email.php";

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
  const [designerTab] = useState('active');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [adminEmail, setAdminEmail] = useState("tu-correo@diseno.com");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationLog, setNotificationLog] = useState([]);
  const [clientSession, setClientSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [newDesign, setNewDesign] = useState({
    title: '', description: '', clientEmail: '', file: null, previewUrl: null
  });

  const STORAGE_LIMIT = 2000;
  const usedStorage = useMemo(
    () => designs.reduce((acc, curr) => acc + (curr.fileSize || 0), 0),
    [designs]
  );
  const storagePercentage = Math.min((usedStorage / STORAGE_LIMIT) * 100, 100);

  const filteredDesigns = useMemo(() => {
    if (viewMode === 'designer') return designs.filter(d => !d.isArchived);
    if (viewMode === 'client' && clientSession)
      return designs.filter(d =>
        d.clientEmail.toLowerCase().trim() === clientSession.toLowerCase().trim() && !d.isArchived
      );
    return [];
  }, [designs, viewMode, clientSession]);

  const handleConnectDrive = () => setIsDriveConnected(true);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewDesign({
        ...newDesign,
        file,
        previewUrl: url,
        fileName: file.name,
        fileSize: Math.floor(Math.random() * 50) + 10
      });
    }
  };

  const sendEmailNotifications = async (design, action = "new") => {
    // 1) Log visual local
    const logMsg = action === "new"
      ? `📧 Enviando a ${design.clientEmail} y copia a ${adminEmail}`
      : `📧 Aviso a ${adminEmail}: Cliente ${action}`;
    setNotificationLog(prev => [logMsg, ...prev].slice(0, 5));

    // 2) Intento de envío real (omitir localhost)
    try {
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (!isLocal && EMAIL_API_URL) {
        await fetch(EMAIL_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: design.clientEmail,
            adminEmail,
            projectTitle: design.title,
            description: `${design.description}\nAcción: ${action}`,
            action
          })
        });
        setNotificationLog(prev => ['✅ Correo real enviado', ...prev].slice(0, 5));
      }
    } catch (e) {
      console.error("Error enviando email:", e);
      setNotificationLog(prev => ['⚠️ Error conexión PHP', ...prev].slice(0, 5));
    }
  };

  const handleSubmitDesign = (e) => {
    e.preventDefault();

    const newEntry = {
      id: Date.now(),
      ...newDesign,
      status: 'pending',
      imageUrl: newDesign.previewUrl
        ?? "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200",
      date: new Date().toISOString().split('T')[0],
      feedback: "",
      isArchived: false,
      driveLinked: isDriveConnected
    };

    setDesigns([newEntry, ...designs]);
    sendEmailNotifications(newEntry, "new");
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

  // Vista de login cliente
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
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
          >
            Ver Mis Diseños
          </button>
          <button
            onClick={() => setViewMode('designer')}
            className="mt-6 text-xs text-slate-400 hover:text-indigo-600 font-medium"
          >
            Volver a Diseñador
          </button>
        </div>
      </div>
    );
  }

  // Vista principal
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Palette className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            DESIGN<span className="text-indigo-600">FLOW</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('designer')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'designer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Diseñador
            </button>
            <button
              onClick={() => setViewMode('client')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'client' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Cliente
            </button>
          </div>
          {viewMode === 'client' && (
            <button onClick={() => setClientSession(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full p-6 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {viewMode === 'designer' && (
            <aside className="lg:w-80 shrink-0 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                >
                  <Upload size={20} /> Nueva Entrega
                </button>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajustes Correo</span>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-slate-400 hover:text-indigo-600">
                      <Settings size={16} />
                    </button>
                  </div>
                  {isSettingsOpen ? (
                    <div className="space-y-2">
                      <input
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <Bell size={14} className="text-indigo-500" />
                      <span className="truncate">{adminEmail}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{usedStorage.toFixed(1)} MB</span>
                    <span className="text-slate-400">{STORAGE_LIMIT} MB</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${storagePercentage > 85 ? 'bg-red-500' : 'bg-indigo-500'}`}
                      style={{ width: `${storagePercentage}%` }}
                    />
                  </div>

                  {!isDriveConnected && (
                    <button
                      onClick={handleConnectDrive}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-2xl text-xs font-bold hover:border-indigo-300 hover:text-indigo-600"
                    >
                      <HardDrive size={14} /> Conectar Google Drive
                    </button>
                  )}
                </div>
              </div>

              {notificationLog.length > 0 && (
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Bell size={12} /> Log de Correos
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
            </aside>
          )}

          <div className="flex-1">
            <header className="mb-8">
              <h1 className="text-3xl font-black text-slate-900">
                {viewMode === 'designer' ? 'Panel de Control' : 'Mis Propuestas'}
              </h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredDesigns.map(design => (
                <div
                  key={design.id}
                  className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    <img
                      src={design.imageUrl}
                      alt={design.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute top-5 right-5">
                      <span
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                          design.status === 'approved'
                            ? 'bg-green-500 text-white'
                            : design.status === 'rejected'
                            ? 'bg-red-500 text-white'
                            : 'bg-amber-400 text-white'
                        }`}
                      >
                        {design.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{design.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4">
                      <Mail size={12} className="text-indigo-400" /> {design.clientEmail}
                    </div>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">{design.description}</p>

                    {design.feedback && (
                      <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                        <MessageSquare size={18} className="text-indigo-500 shrink-0 mt-1" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Feedback</p>
                          <p className="text-xs text-indigo-900 font-medium italic">"{design.feedback}"</p>
                        </div>
                      </div>
                    )}

                    {viewMode === 'client' && design.status === 'pending' && (
                      <div className="mt-auto space-y-4">
                        {activeFeedbackId === design.id ? (
                          <div>
                            <textarea></textarea>
