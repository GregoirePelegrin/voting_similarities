import {createTheme} from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4A90D9",
    },
    secondary: {
      main: "#E8B931",
    },
    background: {
      default: "#1A1F2B",
      paper: "#242B38",
    },
    text: {
      primary: "#E8ECF1",
      secondary: "#9EAAB8",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      letterSpacing: "-0.02em",
    },
    h5: {
      letterSpacing: "-0.01em",
    },
    h6: {
      letterSpacing: "-0.01em",
    },
    body1: {
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export const DATA_COLORS = {
  yesSame: "#59A14F",
  yesDifferent: "#4A90D9",
  noSame: "#E15759",
  noDifferent: "#B07AA1",
  missing: "#555555",
  positive: "#59A14F",
  negative: "#E15759",
  warning: "#EDC948",
  neutral: "#9EAAB8",
  primary: "#4A90D9"
};

export default theme;
