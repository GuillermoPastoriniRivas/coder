import { createTheme } from '@mui/material/styles';

export default createTheme({
  palette: {
    primary: {
      main: '#2563eb',      // Azul vibrante
      light: '#93c5fd',     // Azul claro
      contrastText: '#fff'
    },
    secondary: {
      main: '#4f46e5',      // Índigo
      light: '#c7d2fe'
    },
    background: {
      default: '#f8fafc',   // Fondo suave
      paper: '#ffffff'      // Superficies blancas
    },
    text: {
      primary: '#1e293b',   // Gris oscuro
      secondary: '#64748b'  // Gris medio
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px'
    },
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        }
      }
    }
  }
});