import {downloadModel, sendPrompt} from "./LLM.ts";
import {useEffect, useState, useRef} from "react";
import {useTypedDispatch, useTypedSelector} from "./redux/store.ts";
import {
    AppBar,
    Box,
    Button,
    Container,
    CssBaseline,
    IconButton,
    Paper,
    TextField,
    ThemeProvider,
    Toolbar,
    Typography,
    createTheme,
    Chip,
    Fade,
    Zoom,
    Fab,
    Tooltip,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Badge
} from "@mui/material";
import {
    Send,
    Psychology,
    EmojiEmotions,
    Lightbulb,
    Favorite,
    Spa,
    SelfImprovement,
    CheckCircle,
    WbSunny,
    FitnessCenter,
    MenuBook,
    AutoAwesome,
    Home,
    Refresh,
    Chat,
    Add,
    History,
    Delete,
    Close,
    Restore,
    Visibility,
    PlayArrow,
    ExpandMore,
    ExpandLess
} from "@mui/icons-material";
import Markdown from "react-markdown";
import {setCriticalError, setMessageHistory} from "./redux/llmSlice.ts";
import {isWebGPUok} from "./CheckWebGPU.ts";

const MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const MODEL_SIZE_MB = 664;

// ============================================================
// SISTEMA DE HISTORIAL DE CONVERSACIONES
// ============================================================
const STORAGE_KEY = 'aura_chat_history';
const MAX_HISTORY = 50;

interface ChatHistory {
    id: string;
    title: string;
    date: string;
    messages: { role: string; content: string }[];
    lastMessage?: string;
}

const ChatHistoryStorage = {
    save: (chat: ChatHistory) => {
        try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const filtered = existing.filter((c: ChatHistory) => c.id !== chat.id);
            const updated = [chat, ...filtered].slice(0, MAX_HISTORY);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return true;
        } catch (e) {
            console.error('Error saving chat history:', e);
            return false;
        }
    },
    loadAll: (): ChatHistory[] => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            console.error('Error loading chat history:', e);
            return [];
        }
    },
    delete: (id: string) => {
        try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const filtered = existing.filter((c: ChatHistory) => c.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (e) {
            console.error('Error deleting chat history:', e);
            return false;
        }
    },
    clear: () => {
        localStorage.removeItem(STORAGE_KEY);
    },
    getCurrentChatId: (): string | null => {
        return localStorage.getItem('aura_current_chat_id');
    },
    setCurrentChatId: (id: string) => {
        localStorage.setItem('aura_current_chat_id', id);
    },
    clearCurrentChatId: () => {
        localStorage.removeItem('aura_current_chat_id');
    }
};

// ============================================================
// MENSAJE DE BIENVENIDA
// ============================================================
const WELCOME_TEXT = `👋 ¡Hola! Soy **Aura**, tu acompañante de bienestar cognitivo.

Estoy aquí para escucharte y ayudarte a explorar tus pensamientos, emociones y patrones mentales. No soy un psicólogo, sino un compañero de viaje en tu proceso de autoconocimiento.

Todo lo que compartas queda entre tú y yo. Puedes escribirme sobre lo que sientes, piensas o simplemente lo que necesites expresar.

**¿Por dónde quieres empezar?** 🌿`;

// ============================================================
// PREGUNTAS RÁPIDAS
// ============================================================
const QUICK_QUESTIONS = [
    { text: "¿Cómo puedo manejar la ansiedad?", icon: <EmojiEmotions />, color: "#ff6b6b" },
    { text: "Necesito ordenar mis pensamientos", icon: <MenuBook />, color: "#4ecdc4" },
    { text: "¿Qué técnica de relajación me recomiendas?", icon: <Spa />, color: "#45b7d1" },
    { text: "Ayúdame a ser más amable conmigo mismo", icon: <Favorite />, color: "#ff85a2" },
    { text: "¿Cómo mejorar mi autoestima?", icon: <SelfImprovement />, color: "#a29bfe" },
    { text: "Tengo pensamientos negativos persistentes", icon: <WbSunny />, color: "#fdcb6e" },
    { text: "¿Cómo manejar el estrés diario?", icon: <FitnessCenter />, color: "#00b894" },
    { text: "Quiero practicar la gratitud", icon: <CheckCircle />, color: "#6c5ce7" },
    { text: "¿Qué puedo hacer para dormir mejor?", icon: <Psychology />, color: "#4a6fa5" },
    { text: "Ayúdame a encontrar mi propósito", icon: <Lightbulb />, color: "#f39c12" }
];

export function App() {
    const {downloadStatus, messageHistory, criticalError} = useTypedSelector(state => state.llm);
    const dispatch = useTypedDispatch();
    const [inputValue, setInputValue] = useState('');
    const [alreadyFromCache, setAlreadyFromCache] = useState(false);
    const [loadFinished, setLoadFinished] = useState(false);
    const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    
    // Estados para ver conversación completa
    const [viewChatDialogOpen, setViewChatDialogOpen] = useState(false);
    const [viewingChat, setViewingChat] = useState<ChatHistory | null>(null);
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    // ============================================================
    // CARGAR HISTORIAL AL INICIAR
    // ============================================================
    useEffect(() => {
        const saved = ChatHistoryStorage.loadAll();
        setChatHistory(saved);
        
        const savedChatId = ChatHistoryStorage.getCurrentChatId();
        if (savedChatId && saved.some(c => c.id === savedChatId)) {
            setCurrentChatId(savedChatId);
        }
    }, []);

    // ============================================================
    // GUARDAR CONVERSACIÓN AUTOMÁTICAMENTE
    // ============================================================
    useEffect(() => {
        if (messageHistory.length > 0 && loadFinished) {
            const saveChat = () => {
                const visibleMessages = messageHistory.filter(m => m.content);
                if (visibleMessages.length === 0) return;
                
                const firstUserMessage = visibleMessages.find(m => m.role === 'user');
                const title = firstUserMessage?.content?.slice(0, 40) || 'Nueva conversación';
                const id = currentChatId || `chat_${Date.now()}`;
                
                const chat: ChatHistory = {
                    id,
                    title: title + (title.length >= 40 ? '...' : ''),
                    date: new Date().toISOString(),
                    messages: visibleMessages.map(m => ({ role: m.role, content: m.content || '' })),
                    lastMessage: visibleMessages[visibleMessages.length - 1]?.content?.slice(0, 60) || ''
                };
                
                ChatHistoryStorage.save(chat);
                ChatHistoryStorage.setCurrentChatId(id);
                setCurrentChatId(id);
                setChatHistory(prev => {
                    const filtered = prev.filter(c => c.id !== id);
                    return [chat, ...filtered].slice(0, MAX_HISTORY);
                });
            };
            
            if (messageHistory.length % 3 === 0) {
                saveChat();
            }
        }
    }, [messageHistory, loadFinished, currentChatId]);

    // ============================================================
    // GUARDAR AL CERRAR LA PESTAÑA
    // ============================================================
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (messageHistory.length > 0 && loadFinished) {
                const visibleMessages = messageHistory.filter(m => m.content);
                if (visibleMessages.length === 0) return;
                
                const firstUserMessage = visibleMessages.find(m => m.role === 'user');
                const title = firstUserMessage?.content?.slice(0, 40) || 'Nueva conversación';
                const id = currentChatId || `chat_${Date.now()}`;
                
                const chat: ChatHistory = {
                    id,
                    title: title + (title.length >= 40 ? '...' : ''),
                    date: new Date().toISOString(),
                    messages: visibleMessages.map(m => ({ role: m.role, content: m.content || '' })),
                    lastMessage: visibleMessages[visibleMessages.length - 1]?.content?.slice(0, 60) || ''
                };
                
                ChatHistoryStorage.save(chat);
                ChatHistoryStorage.setCurrentChatId(id);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [messageHistory, loadFinished, currentChatId]);

    // ============================================================
    // SCROLL AUTOMÁTICO
    // ============================================================
    useEffect(() => {
        if (chatEndRef.current && messageHistory.length > 0) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messageHistory]);

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    useEffect(() => {
        isWebGPUok().then(trueOrError => {
                if (trueOrError !== true) {
                    dispatch(setCriticalError('WebGPU error: ' + trueOrError));
                }
            }
        )
        if (!('caches' in window)) {
            dispatch(setCriticalError('Cache API is not supported in your browser'));
        }
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                if (estimate) {
                    const remainingMb = (estimate.quota - estimate.usage) / 1024 / 1024;
                    if (!alreadyFromCache && remainingMb > 10 && remainingMb < MODEL_SIZE_MB) {
                        dispatch(setCriticalError('Remaining cache storage, that browser allowed is too low'));
                    }
                }
            });
        } else {
            dispatch(setCriticalError('StorageManager API is not supported in your browser'));
        }

        if (localStorage.getItem('downloaded_models')) {
            setAlreadyFromCache(true);
            downloadModel(MODEL).then(() => setLoadFinished(true));
        }

    }, []);

    // ============================================================
    // FUNCIONES
    // ============================================================
    function submitPrompt(e: { preventDefault: () => void; }) {
        e.preventDefault();
        if (inputValue.trim()) {
            sendPrompt(inputValue);
            setInputValue('');
        }
    }

    const handleQuickQuestion = (question: string) => {
        sendPrompt(question);
    };

    // ============================================================
    // NUEVO CHAT
    // ============================================================
    const handleNewChat = () => {
        if (messageHistory.length > 0 && loadFinished) {
            const visibleMessages = messageHistory.filter(m => m.content);
            if (visibleMessages.length > 0) {
                const firstUserMessage = visibleMessages.find(m => m.role === 'user');
                const title = firstUserMessage?.content?.slice(0, 40) || 'Nueva conversación';
                const id = currentChatId || `chat_${Date.now()}`;
                
                const chat: ChatHistory = {
                    id,
                    title: title + (title.length >= 40 ? '...' : ''),
                    date: new Date().toISOString(),
                    messages: visibleMessages.map(m => ({ role: m.role, content: m.content || '' })),
                    lastMessage: visibleMessages[visibleMessages.length - 1]?.content?.slice(0, 60) || ''
                };
                
                ChatHistoryStorage.save(chat);
                ChatHistoryStorage.setCurrentChatId(id);
                setCurrentChatId(id);
                setChatHistory(prev => {
                    const filtered = prev.filter(c => c.id !== id);
                    return [chat, ...filtered].slice(0, MAX_HISTORY);
                });
            }
        }
        window.location.reload();
    };

    // ============================================================
    // CARGAR Y CONTINUAR CONVERSACIÓN
    // ============================================================
    const handleContinueChat = (chat: ChatHistory) => {
        setHistoryDrawerOpen(false);
        localStorage.setItem('aura_load_chat', JSON.stringify(chat));
        ChatHistoryStorage.setCurrentChatId(chat.id);
        window.location.reload();
    };

    // ============================================================
    // VER CONVERSACIÓN COMPLETA
    // ============================================================
    const handleViewChat = (chat: ChatHistory) => {
        setViewingChat(chat);
        setViewChatDialogOpen(true);
    };

    // ============================================================
    // ELIMINAR CONVERSACIÓN
    // ============================================================
    const handleDeleteChat = (id: string) => {
        setChatToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteChat = () => {
        if (chatToDelete) {
            ChatHistoryStorage.delete(chatToDelete);
            setChatHistory(prev => prev.filter(c => c.id !== chatToDelete));
            setDeleteDialogOpen(false);
            setChatToDelete(null);
        }
    };

    // ============================================================
    // VOLVER AL INICIO DEL CHAT
    // ============================================================
    const goToHome = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setInputValue('');
    };

    // ============================================================
    // FORMATO DE FECHA
    // ============================================================
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        if (diff < 60000) return 'Ahora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
        
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric'
        });
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            
            {/* AppBar */}
            <AppBar position="static" sx={{ 
                bgcolor: '#1a1a2e',
                background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                zIndex: 1100
            }}>
                <Toolbar sx={{
                    maxWidth: '1200px !important',
                    margin: '0 auto',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Botón de historial */}
                        {loadFinished && (
                            <Tooltip title="Historial de conversaciones" arrow>
                                <Badge badgeContent={chatHistory.length} color="secondary" invisible={chatHistory.length === 0}>
                                    <IconButton 
                                        onClick={() => setHistoryDrawerOpen(true)}
                                        sx={{ 
                                            color: '#90caf9',
                                            '&:hover': {
                                                bgcolor: 'rgba(144, 202, 249, 0.1)'
                                            }
                                        }}
                                    >
                                        <History />
                                    </IconButton>
                                </Badge>
                            </Tooltip>
                        )}
                        
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            position: 'relative'
                        }}>
                            <Psychology sx={{ 
                                fontSize: 28, 
                                color: '#90caf9',
                                animation: loadFinished ? 'pulse 2s ease-in-out infinite' : 'spin 1s linear infinite'
                            }} />
                            {!loadFinished && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: '#ffd700',
                                    animation: 'pulse 1s ease-in-out infinite'
                                }} />
                            )}
                            {loadFinished && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: '#4ade80',
                                    boxShadow: '0 0 10px #4ade80'
                                }} />
                            )}
                        </Box>
                        <Box>
                            <Typography variant="h6" component="div" sx={{ 
                                fontWeight: 600,
                                background: 'linear-gradient(90deg, #90caf9, #a78bfa)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Aura 🌿
                            </Typography>
                            <Typography variant="caption" sx={{ 
                                color: loadFinished ? '#4ade80' : '#ffd700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontSize: '0.65rem'
                            }}>
                                <Box component="span" sx={{ 
                                    display: 'inline-block',
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: loadFinished ? '#4ade80' : '#ffd700',
                                    animation: loadFinished ? 'pulse 2s ease-in-out infinite' : 'pulse 1s ease-in-out infinite'
                                }} />
                                {loadFinished ? 'En línea' : 'Conectando...'}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Botón "Nuevo chat" */}
                        {loadFinished && (
                            <Tooltip title="Nuevo chat" arrow>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleNewChat}
                                    startIcon={<Add />}
                                    sx={{
                                        borderColor: 'rgba(144, 202, 249, 0.3)',
                                        color: '#90caf9',
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#90caf9',
                                            bgcolor: 'rgba(144, 202, 249, 0.1)'
                                        }
                                    }}
                                >
                                    Nuevo chat
                                </Button>
                            </Tooltip>
                        )}
                        
                        {loadFinished && (
                            <Zoom in={loadFinished}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AutoAwesome sx={{ fontSize: 16, color: '#ffd700' }} />
                                    <Typography variant="caption" sx={{ color: '#90caf9', opacity: 0.7 }}>
                                        Listo
                                    </Typography>
                                </Box>
                            </Zoom>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* ============================================================
                DRAWER DE HISTORIAL - MEJORADO
            ============================================================ */}
            <Drawer
                anchor="left"
                open={historyDrawerOpen}
                onClose={() => setHistoryDrawerOpen(false)}
                PaperProps={{
                    sx: { 
                        width: 400,
                        bgcolor: '#12121f',
                        borderRight: '1px solid rgba(255,255,255,0.05)'
                    }
                }}
            >
                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(144, 202, 249, 0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Typography variant="h6" sx={{ color: '#90caf9', fontWeight: 600 }}>
                        <History sx={{ verticalAlign: 'middle', mr: 1, fontSize: 22 }} />
                        Conversaciones
                    </Typography>
                    <IconButton 
                        onClick={() => setHistoryDrawerOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        <Close />
                    </IconButton>
                </Box>
                
                <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                    {chatHistory.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Chat sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                            <Typography color="rgba(255,255,255,0.3)">
                                No hay conversaciones guardadas
                            </Typography>
                            <Typography variant="caption" color="rgba(255,255,255,0.2)">
                                Las conversaciones se guardan automáticamente
                            </Typography>
                        </Box>
                    ) : (
                        <List>
                            {chatHistory.map((chat) => (
                                <ListItem
                                    key={chat.id}
                                    disablePadding
                                    sx={{ 
                                        mb: 1,
                                        bgcolor: currentChatId === chat.id ? 'rgba(144, 202, 249, 0.08)' : 'transparent',
                                        borderRadius: 2,
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.05)'
                                        }
                                    }}
                                >
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        width: '100%',
                                        p: 1
                                    }}>
                                        {/* Título y fecha */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography sx={{ 
                                                color: currentChatId === chat.id ? '#90caf9' : 'rgba(255,255,255,0.8)',
                                                fontWeight: currentChatId === chat.id ? 600 : 400,
                                                fontSize: '0.9rem',
                                                flex: 1,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {chat.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', ml: 1 }}>
                                                {formatDate(chat.date)}
                                            </Typography>
                                        </Box>
                                        
                                        {/* Último mensaje */}
                                        <Typography variant="caption" sx={{ 
                                            color: 'rgba(255,255,255,0.3)', 
                                            display: 'block',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            mt: 0.3
                                        }}>
                                            {chat.lastMessage || 'Sin mensajes'}
                                        </Typography>
                                        
                                        {/* Botones de acción */}
                                        <Box sx={{ 
                                            display: 'flex', 
                                            gap: 1, 
                                            mt: 1,
                                            justifyContent: 'flex-start'
                                        }}>
                                            {/* Botón Ver conversación */}
                                            <Tooltip title="Ver conversación completa" arrow>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleViewChat(chat)}
                                                    startIcon={<Visibility />}
                                                    sx={{
                                                        borderColor: 'rgba(144, 202, 249, 0.2)',
                                                        color: '#90caf9',
                                                        fontSize: '0.65rem',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            borderColor: '#90caf9',
                                                            bgcolor: 'rgba(144, 202, 249, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    Ver
                                                </Button>
                                            </Tooltip>
                                            
                                            {/* Botón Continuar conversación */}
                                            <Tooltip title="Continuar esta conversación" arrow>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleContinueChat(chat)}
                                                    startIcon={<PlayArrow />}
                                                    sx={{
                                                        bgcolor: 'rgba(144, 202, 249, 0.15)',
                                                        color: '#90caf9',
                                                        fontSize: '0.65rem',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(144, 202, 249, 0.25)'
                                                        }
                                                    }}
                                                >
                                                    Continuar
                                                </Button>
                                            </Tooltip>
                                            
                                            {/* Botón Eliminar */}
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleDeleteChat(chat.id)}
                                                sx={{ 
                                                    color: 'rgba(255,255,255,0.2)',
                                                    '&:hover': {
                                                        color: '#e74c3c',
                                                        bgcolor: 'rgba(231, 76, 60, 0.1)'
                                                    }
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
                
                {chatHistory.length > 0 && (
                    <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                if (window.confirm('¿Eliminar todas las conversaciones guardadas?')) {
                                    ChatHistoryStorage.clear();
                                    setChatHistory([]);
                                    setHistoryDrawerOpen(false);
                                }
                            }}
                            startIcon={<Delete />}
                            sx={{
                                borderColor: 'rgba(231, 76, 60, 0.3)',
                                color: '#e74c3c',
                                '&:hover': {
                                    borderColor: '#e74c3c',
                                    bgcolor: 'rgba(231, 76, 60, 0.1)'
                                }
                            }}
                        >
                            Eliminar todo el historial
                        </Button>
                    </Box>
                )}
            </Drawer>

            {/* ============================================================
                DIALOG PARA VER CONVERSACIÓN COMPLETA
            ============================================================ */}
            <Dialog
                open={viewChatDialogOpen}
                onClose={() => setViewChatDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1a2e',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.05)',
                        maxHeight: '80vh'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    color: '#90caf9', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box>
                        <Chat sx={{ verticalAlign: 'middle', mr: 1 }} />
                        {viewingChat?.title || 'Conversación'}
                        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.3)', mt: 0.5 }}>
                            {viewingChat && formatDate(viewingChat.date)} · {viewingChat?.messages.length || 0} mensajes
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={() => setViewChatDialogOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 2, overflow: 'auto' }}>
                    {viewingChat && viewingChat.messages.map((msg, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                mb: 2
                            }}
                        >
                            <Paper
                                sx={{
                                    p: 1.5,
                                    maxWidth: '80%',
                                    bgcolor: msg.role === 'user' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(255,255,255,0.05)',
                                    border: msg.role === 'user' 
                                        ? '1px solid rgba(144, 202, 249, 0.2)' 
                                        : '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{ 
                                        color: msg.role === 'user' ? '#90caf9' : 'rgba(255,255,255,0.5)',
                                        display: 'block',
                                        mb: 0.5,
                                        fontSize: '0.6rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1
                                    }}
                                >
                                    {msg.role === 'user' ? 'Tú' : 'Aura'}
                                </Typography>
                                <Box sx={{ 
                                    '& p': { margin: 0, color: '#fff' },
                                    '& strong': { color: '#90caf9' },
                                    '& em': { color: 'rgba(255,255,255,0.6)' },
                                    '& h1, & h2, & h3, & h4': { color: '#90caf9' }
                                }}>
                                    <Markdown>{msg.content}</Markdown>
                                </Box>
                            </Paper>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button 
                        onClick={() => setViewChatDialogOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        Cerrar
                    </Button>
                    {viewingChat && (
                        <Button 
                            variant="contained"
                            onClick={() => {
                                setViewChatDialogOpen(false);
                                handleContinueChat(viewingChat);
                            }}
                            startIcon={<PlayArrow />}
                            sx={{
                                bgcolor: 'rgba(144, 202, 249, 0.15)',
                                color: '#90caf9',
                                '&:hover': {
                                    bgcolor: 'rgba(144, 202, 249, 0.25)'
                                }
                            }}
                        >
                            Continuar conversación
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* ============================================================
                CONTENIDO PRINCIPAL
            ============================================================ */}
            <Container sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'center',
                paddingBottom: '100px',
                maxWidth: '1200px !important',
                bgcolor: '#0a0a1a',
                minHeight: 'calc(100vh - 64px)',
                position: 'relative'
            }}>
                
                {/* Estado de carga */}
                {!alreadyFromCache && !loadFinished && !criticalError && (
                    <Box sx={{ 
                        textAlign: 'center', 
                        mb: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3
                    }}>
                        <Box sx={{ position: 'relative' }}>
                            <Box sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                border: '3px solid rgba(144, 202, 249, 0.1)',
                                borderTop: '3px solid #90caf9',
                                animation: 'spin 1s linear infinite',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Psychology sx={{ fontSize: 32, color: '#90caf9' }} />
                            </Box>
                            <Box sx={{
                                position: 'absolute',
                                bottom: -10,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 60,
                                height: 2,
                                bgcolor: 'rgba(144, 202, 249, 0.3)',
                                borderRadius: 2,
                                animation: 'loadingBar 1.5s ease-in-out infinite'
                            }} />
                        </Box>
                        <Typography variant="h5" sx={{ 
                            fontWeight: 300,
                            color: '#90caf9',
                            opacity: 0.9
                        }}>
                            Preparando tu espacio de bienestar...
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {downloadStatus || 'Inicializando...'}
                        </Typography>
                        <Box sx={{ 
                            width: 200, 
                            height: 3, 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}>
                            <Box sx={{
                                width: '30%',
                                height: '100%',
                                bgcolor: '#90caf9',
                                borderRadius: 2,
                                animation: 'loadingBar 2s ease-in-out infinite'
                            }} />
                        </Box>
                        <Button 
                            variant="outlined" 
                            sx={{
                                borderColor: 'rgba(144, 202, 249, 0.3)',
                                color: '#90caf9',
                                '&:hover': {
                                    borderColor: '#90caf9',
                                    bgcolor: 'rgba(144, 202, 249, 0.1)'
                                }
                            }}
                            onClick={() => downloadModel(MODEL).then(() => setLoadFinished(true))}
                        >
                            Descargar modelo ({MODEL_SIZE_MB}MB)
                        </Button>
                    </Box>
                )}

                <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', mb: 2, fontSize: '0.75rem' }}>
                        {downloadStatus && !loadFinished ? `Cargando: ${downloadStatus}` : ''}
                    </Typography>
                    
                    {criticalError && (
                        <Typography color="error" sx={{ mb: 2 }}>{criticalError}</Typography>
                    )}

                    {/* ============================================================
                        PANTALLA DE INICIO - SIN MENSAJES
                    ============================================================ */}
                    {loadFinished && messageHistory.length === 0 && (
                        <Fade in timeout={800}>
                            <Box>
                                <Box sx={{ 
                                    mb: 4,
                                    p: 3,
                                    bgcolor: 'rgba(144, 202, 249, 0.05)',
                                    borderRadius: 3,
                                    border: '1px solid rgba(144, 202, 249, 0.1)'
                                }}>
                                    <Markdown>{WELCOME_TEXT}</Markdown>
                                </Box>

                                <Typography variant="body2" sx={{ 
                                    color: 'rgba(255,255,255,0.4)',
                                    mb: 2,
                                    fontSize: '0.8rem',
                                    letterSpacing: 1,
                                    textAlign: 'center'
                                }}>
                                    🌱 ELIGE UNA PREGUNTA PARA COMENZAR
                                </Typography>

                                <Box sx={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: 1,
                                    justifyContent: 'center'
                                }}>
                                    {QUICK_QUESTIONS.map((q, index) => (
                                        <Zoom in key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                                            <Chip
                                                icon={q.icon}
                                                label={q.text}
                                                onClick={() => handleQuickQuestion(q.text)}
                                                sx={{
                                                    height: 'auto',
                                                    py: 1,
                                                    px: 0.5,
                                                    color: '#fff',
                                                    borderColor: `${q.color}40`,
                                                    bgcolor: 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${q.color}30`,
                                                    '& .MuiChip-label': {
                                                        whiteSpace: 'normal',
                                                        padding: '4px 12px',
                                                        fontSize: '0.8rem'
                                                    },
                                                    '& .MuiChip-icon': {
                                                        color: q.color,
                                                        fontSize: '1.1rem'
                                                    },
                                                    '&:hover': {
                                                        bgcolor: `${q.color}15`,
                                                        borderColor: `${q.color}60`,
                                                        transform: 'scale(1.02)',
                                                        transition: 'all 0.2s'
                                                    }
                                                }}
                                            />
                                        </Zoom>
                                    ))}
                                </Box>
                            </Box>
                        </Fade>
                    )}

                    {/* ============================================================
                        CHAT - CON MENSAJES
                    ============================================================ */}
                    {messageHistory.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {messageHistory.map((message, i) => (
                                <Fade in key={i} timeout={300}>
                                    <Paper
                                        sx={{
                                            p: 1.5,
                                            maxWidth: '80%',
                                            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                                            bgcolor: message.role === 'user' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(255,255,255,0.05)',
                                            border: message.role === 'user' 
                                                ? '1px solid rgba(144, 202, 249, 0.2)' 
                                                : '1px solid rgba(255,255,255,0.05)',
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    >
                                        <Typography
                                            variant="body2" 
                                            sx={{ 
                                                color: message.role === 'user' ? '#90caf9' : 'rgba(255,255,255,0.5)',
                                                mb: 0.5,
                                                fontSize: '0.7rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1
                                            }}
                                        >
                                            {message.role === 'user' ? 'Tú' : 'Aura'}
                                        </Typography>
                                        <Box sx={{ 
                                            '& p': { margin: 0, color: '#fff' },
                                            '& strong': { color: '#90caf9' },
                                            '& em': { color: 'rgba(255,255,255,0.6)' },
                                            '& h1, & h2, & h3, & h4': { color: '#90caf9' }
                                        }}>
                                            <Markdown>{message.content}</Markdown>
                                        </Box>
                                    </Paper>
                                </Fade>
                            ))}
                            <div ref={chatEndRef} />
                        </Box>
                    )}
                </Box>

                {/* ============================================================
                    INPUT
                ============================================================ */}
                {!criticalError && loadFinished && (
                    <Box sx={{
                        position: messageHistory.length > 0 ? 'fixed' : 'static',
                        bottom: messageHistory.length > 0 ? 0 : 'auto',
                        left: 0,
                        right: 0,
                        bgcolor: 'rgba(10, 10, 26, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        p: 2,
                        zIndex: 1000
                    }}>
                        <Paper 
                            component="form" 
                            onSubmit={submitPrompt}
                            sx={{
                                p: '2px 4px',
                                display: loadFinished ? 'flex' : 'none',
                                alignItems: 'center',
                                mx: 'auto',
                                width: '100%',
                                maxWidth: '1200px',
                                bgcolor: 'rgba(255,255,255,0.05)',
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <TextField
                                fullWidth
                                variant="standard"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={messageHistory.length === 0 ? "Escribe tu mensaje o elige una pregunta..." : "Escribe tu mensaje..."}
                                sx={{
                                    ml: 1, 
                                    flex: 1,
                                    '& .MuiInputBase-root': {
                                        color: '#fff',
                                        '&:before, &:after': {
                                            display: 'none'
                                        }
                                    }
                                }}
                                InputProps={{ disableUnderline: true }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        submitPrompt(e);
                                    }
                                }}
                            />
                            <IconButton 
                                type="submit" 
                                sx={{ 
                                    p: '10px',
                                    color: inputValue.trim() ? '#90caf9' : 'rgba(255,255,255,0.2)',
                                    '&:hover': {
                                        color: '#90caf9',
                                        bgcolor: 'rgba(144, 202, 249, 0.1)'
                                    }
                                }} 
                                aria-label="send"
                            >
                                <Send/>
                            </IconButton>
                        </Paper>
                        <Typography variant="caption" sx={{ 
                            display: 'block', 
                            textAlign: 'center', 
                            mt: 1,
                            color: 'rgba(255,255,255,0.15)',
                            fontSize: '0.6rem',
                            letterSpacing: 1
                        }}>
                            🌿 Espacio seguro · Todo queda entre tú y Aura · {chatHistory.length} conversaciones guardadas
                        </Typography>
                    </Box>
                )}
            </Container>

            {/* ============================================================
                BOTÓN FLOTANTE - Ir al inicio del chat
            ============================================================ */}
            {loadFinished && messageHistory.length > 0 && (
                <Zoom in>
                    <Tooltip title="Ir al inicio" arrow placement="left">
                        <Fab
                            onClick={goToHome}
                            sx={{
                                position: 'fixed',
                                bottom: 100,
                                right: 30,
                                bgcolor: 'rgba(144, 202, 249, 0.15)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(144, 202, 249, 0.2)',
                                color: '#90caf9',
                                '&:hover': {
                                    bgcolor: 'rgba(144, 202, 249, 0.25)',
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 0 30px rgba(144, 202, 249, 0.2)'
                                },
                                transition: 'all 0.3s',
                                zIndex: 1000
                            }}
                        >
                            <Chat />
                        </Fab>
                    </Tooltip>
                </Zoom>
            )}

            {/* ============================================================
                DIALOG DE CONFIRMACIÓN - ELIMINAR CHAT
            ============================================================ */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1a2e',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.05)'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#fff' }}>
                    <Delete sx={{ verticalAlign: 'middle', mr: 1, color: '#e74c3c' }} />
                    Eliminar conversación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        ¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={confirmDeleteChat}
                        sx={{ 
                            bgcolor: '#e74c3c',
                            '&:hover': { bgcolor: '#c0392b' }
                        }}
                        startIcon={<Delete />}
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Animaciones CSS */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.9); }
                }
                @keyframes loadingBar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
        </ThemeProvider>
    )
}

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0a0a1a',
            paper: 'rgba(255,255,255,0.03)',
        },
        primary: {
            main: '#90caf9',
        },
        secondary: {
            main: '#a78bfa',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255,255,255,0.6)',
        },
    },
    typography: {
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        body1: {
            fontSize: '0.95rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.85rem',
            lineHeight: 1.5,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: 'none',
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundImage: 'none',
                }
            }
        }
    }
});