import { createTheme } from '@mui/material/styles';

// Define the dark theme inspired by VS Code
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#0D6EFD', // A modern, vibrant blue
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#6c757d', // A subtle grey for secondary elements
            contrastText: '#ffffff',
        },
        background: {
            default: '#1e1e1e', // VS Code default dark background
            paper: '#252526', // Slightly lighter background for surfaces like cards, menus
        },
        text: {
            primary: '#d4d4d4', // Light grey text, common in dark themes
            secondary: '#858585', // Dimmer text for secondary info
        },
        error: {
            main: '#f44336', // Standard error red
        },
        success: {
            main: '#4caf50', // Standard success green
        },
        divider: 'rgba(255, 255, 255, 0.12)', // Subtle divider color
    },
    typography: {
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', // Modern sans-serif stack
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: {
            textTransform: 'none', // Buttons with normal casing
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 6, // Slightly rounded corners
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#333333', // Darker AppBar background
                    boxShadow: 'none', // Cleaner look without shadow
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4, // Consistent border radius
                    padding: '8px 16px', // Comfortable padding
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#0b5ed7', // Darker blue on hover
                    },
                },
                outlinedPrimary: {
                   borderColor: 'rgba(13, 110, 253, 0.5)', // Softer border for outlined
                   '&:hover': {
                     backgroundColor: 'rgba(13, 110, 253, 0.08)', // Slight background on hover
                     borderColor: '#0D6EFD',
                   }
                },
                 containedSecondary: {
                    backgroundColor: '#495057', // Darker grey secondary button
                     '&:hover': {
                        backgroundColor: '#343a40',
                    },
                },
                 outlinedSecondary: {
                   borderColor: 'rgba(108, 117, 125, 0.5)',
                    color: '#adb5bd',
                   '&:hover': {
                     backgroundColor: 'rgba(108, 117, 125, 0.08)',
                     borderColor: '#6c757d',
                   }
                }
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: '#2a2a2a', // Darker input background
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.23)', // Default border
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)', // Border on hover
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#0D6EFD', // Primary color border when focused
                        },
                        '& input': {
                            color: '#d4d4d4', // Ensure input text color is correct
                        },
                    },
                     '& .MuiInputLabel-root': {
                       color: '#858585', // Label color
                    },
                     '& .MuiInputLabel-root.Mui-focused': {
                       color: '#0D6EFD', // Label color when focused
                    },
                     '& .MuiFormHelperText-root': {
                       color: '#858585', // Helper text color
                    }
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: '#252526', // Consistent paper background
                },
            },
        },
         MuiCard: {
            styleOverrides: {
                root: {
                     backgroundColor: '#252526',
                     border: '1px solid rgba(255, 255, 255, 0.12)', // Subtle border
                     boxShadow: 'none', // Remove default shadow for a flatter look
                },
            },
        },
        MuiChip: {
           styleOverrides: {
                root: {
                    backgroundColor: '#333333', // Darker chip background
                    color: '#d4d4d4',
                },
                colorPrimary: {
                    backgroundColor: 'rgba(13, 110, 253, 0.2)', // Primary chip with transparency
                    color: '#66b0ff', // Lighter blue text for primary chip
                },
                colorSecondary: {
                     backgroundColor: 'rgba(108, 117, 125, 0.2)', // Secondary chip with transparency
                     color: '#adb5bd', // Lighter grey text for secondary chip
                },
                deleteIcon: {
                    color: 'rgba(212, 212, 212, 0.7)', // Adjust delete icon color
                     '&:hover': {
                         color: '#d4d4d4',
                    }
                }
            }
        },
         MuiList: {
             styleOverrides: {
                 root: {
                    paddingTop: 0,
                    paddingBottom: 0,
                }
             }
         },
         MuiListItem: {
             styleOverrides: {
                 root: {
                    '&.Mui-selected': { // Style for selected items if needed
                        backgroundColor: 'rgba(13, 110, 253, 0.15)',
                    },
                     '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)', // Hover effect for list items
                     }
                },
                button: { // Ensure hover effect applies to button list items
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    }
                }
             }
         },
          MuiLink: {
            styleOverrides: {
                root: {
                     color: '#66b0ff', // Lighter blue for links
                     '&:hover': {
                         color: '#99caff',
                    }
                }
            }
        },
         MuiTooltip: {
             styleOverrides: {
                 tooltip: {
                     backgroundColor: '#333333', // Dark tooltip background
                     color: '#d4d4d4',
                     fontSize: '0.8rem',
                },
                 arrow: {
                     color: '#333333',
                }
            }
        },
         MuiLinearProgress: {
             styleOverrides: {
                 root: {
                    height: '6px',
                    borderRadius: 3,
                },
                 bar: {
                    borderRadius: 3,
                }
            }
        },
        // You can add more component overrides here following the same pattern
    },
});

export default darkTheme;