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
    Zoom
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
    AutoAwesome
} from "@mui/icons-material";
import Markdown from "react-markdown";
import {setCriticalError} from "./redux/llmSlice.ts";
import {isWebGPUok} from "./CheckWebGPU.ts";

const MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const MODEL_SIZE_MB = 664;

// ============================================================
// MENSAJE DE BIENVENIDA (texto, no prompt)
// ============================================================
const WELCOME_TEXT = `👋 ¡Hola! Soy **Aura**, tu acompañante de bienestar cognitivo.

Estoy aquí para escucharte y ayudarte a explorar tus pensamientos, emociones y patrones mentales. No soy un psicólogo, sino un compañero de viaje en tu proceso de autoconocimiento.

Todo lo que compartas queda entre tú y yo. Puedes escribirme sobre lo que sientes, piensas o simplemente lo que necesites expresar.

**¿Por dónde quieres empezar?** 🌿`;

// ============================================================
// PREGUNTAS RÁPIDAS (más opciones)
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
    const [showWelcome, setShowWelcome] = useState(true);
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll automático al final del chat
    useEffect(() => {
        if (chatEndRef.current && messageHistory.length > 0) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messageHistory]);

    // Ocultar bienvenida y preguntas cuando hay mensajes
    useEffect(() => {
        if (messageHistory.length > 0) {
            setShowWelcome(false);
            setShowQuickQuestions(false);
        }
    }, [messageHistory]);

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

    function submitPrompt(e: { preventDefault: () => void; }) {
        e.preventDefault();
        if (inputValue.trim()) {
            sendPrompt(inputValue);
            setInputValue('');
            setShowWelcome(false);
            setShowQuickQuestions(false);
        }
    }

    const handleQuickQuestion = (question: string) => {
        sendPrompt(question);
        setShowWelcome(false);
        setShowQuickQuestions(false);
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            
            {/* AppBar con animación */}
            <AppBar position="static" sx={{ 
                bgcolor: '#1a1a2e',
                background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
                <Toolbar sx={{
                    maxWidth: '1200px !important',
                    margin: '0 auto',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                    <Box sx={{ flexGrow: 1 }} />
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
                </Toolbar>
            </AppBar>

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
                
                {/* Estado de carga con animación */}
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

                    {/* Mensaje de bienvenida (texto, no prompt) */}
                    <Fade in={showWelcome && loadFinished} timeout={800}>
                        <Box sx={{ 
                            display: showWelcome && loadFinished ? 'block' : 'none',
                            mb: 3,
                            p: 3,
                            bgcolor: 'rgba(144, 202, 249, 0.05)',
                            borderRadius: 3,
                            border: '1px solid rgba(144, 202, 249, 0.1)'
                        }}>
                            <Markdown>{WELCOME_TEXT}</Markdown>
                        </Box>
                    </Fade>

                    {/* Mensajes del chat */}
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

                    {/* Preguntas rápidas */}
                    {showQuickQuestions && loadFinished && messageHistory.length === 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" sx={{ 
                                color: 'rgba(255,255,255,0.4)',
                                mb: 2,
                                fontSize: '0.8rem',
                                letterSpacing: 1
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
                    )}
                </Box>

                {/* Input */}
                {!criticalError && (
                    <Box sx={{
                        position: messageHistory.length > 0 ? 'fixed' : 'static',
                        bottom: messageHistory.length > 0 ? 0 : 'auto',
                        left: 0,
                        right: 0,
                        bgcolor: 'rgba(10, 10, 26, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        p: 2,
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
                                placeholder="Escribe tu mensaje..."
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
                            🌿 Espacio seguro · Todo queda entre tú y Aura
                        </Typography>
                    </Box>
                )}
            </Container>

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
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
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
        }
    }
});