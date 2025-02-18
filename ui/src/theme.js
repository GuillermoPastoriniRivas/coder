import { createTheme } from '@mui/material/styles';

export default createTheme({
  palette: {
    primary: {
      main: '#0084ff',      // Azul vibrante similar a OpenAI
      light: '#66b3ff',     // Azul claro
      contrastText: '#fff'
    },
    secondary: {
      main: '#e5e5ea',      // Gris claro actualizado
      contrastText: '#000'
    },
    background: {
      default: '#ffffff',   // Fondo blanco
      paper: '#f8f9fa'      // Superficies ligeramente grises
    },
    text: {
      primary: '#333333',   // Gris oscuro
      secondary: '#555555'  // Gris medio
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif'
    ].join(','),
    h4: {
      fontWeight: 700,
      color: '#333333',
      letterSpacing: '-0.5px'
    },
    body1: {
      fontSize: '16px',
      lineHeight: '1.5',
      color: '#555555'
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
          borderRadius: '20px',
          padding: '10px 20px'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            bgcolor: 'background.default'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '16px',
          backgroundColor: '#ffffff'
        }
      }
    }
  }
});