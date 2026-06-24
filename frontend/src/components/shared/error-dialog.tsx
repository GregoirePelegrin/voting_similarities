import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { observer } from "mobx-react-lite";
import rootStore from "../../stores/root-store";

const ErrorDialog: React.FC = observer(() => {
  const { ui } = rootStore;

  const handleRetry = async () => {
    ui.clearError();
    await rootStore.init();
  };

  const handleDismiss = () => {
    ui.clearError();
  };

  return (
    <Dialog open={ui.error !== null} onClose={handleDismiss}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ErrorOutlineIcon color="error" />
        Connection Error
      </DialogTitle>
      <DialogContent>
        <Typography>
          {ui.error}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDismiss}>Dismiss</Button>
        <Button onClick={handleRetry} variant="contained" color="primary">
          Retry
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default ErrorDialog;
