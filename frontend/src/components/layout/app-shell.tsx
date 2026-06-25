import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";
import QuizIcon from "@mui/icons-material/Quiz";
import MenuIcon from "@mui/icons-material/Menu";
import { observer } from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import ErrorDialog from "../shared/error-dialog";

const DRAWER_WIDTH = 220;

const navItems = [
  { label: "Map", icon: <MapIcon />, path: "/" },
  { label: "People", icon: <PeopleIcon />, path: "/people" },
  { label: "Groups", icon: <GroupsIcon />, path: "/groups" },
  { label: "Questions", icon: <QuizIcon />, path: "/questions" },
];

const NavDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, bgcolor: "#1E2433" } }}
    >
      <Toolbar />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path)
            }
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  item.path === "/"
                    ? location.pathname === "/" ? "#4A90D9" : "inherit"
                    : location.pathname.startsWith(item.path)
                    ? "#4A90D9"
                    : "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = observer(({ children }) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { ui } = rootStore;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ bgcolor: "#1E2433", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 500, letterSpacing: "-0.01em" }}>
            Groups Comparison
          </Typography>
        </Toolbar>
      </AppBar>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Box component="main" sx={{ flexGrow: 1, mt: 8 }}>
        {children}
      </Box>

      <Snackbar
        open={ui.snackbar.open}
        autoHideDuration={4000}
        onClose={() => ui.closeSnackbar()}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => ui.closeSnackbar()} severity={ui.snackbar.severity} variant="filled">
          {ui.snackbar.message}
        </Alert>
      </Snackbar>

      <ErrorDialog />
    </Box>
  );
});

export default AppShell;
