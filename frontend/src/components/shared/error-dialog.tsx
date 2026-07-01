import React from "react";
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import {ERROR_DIALOG} from "../../constants/fr";

const ErrorDialog: React.FC = observer(() => {
  const {uiStore} = rootStore;

  const handleRetry = async () => {
    uiStore.clearError();
    uiStore.incrementRetry();
    await rootStore.init();
  };

  const handleDismiss = () => {
    uiStore.clearError();
  };

  return (
    <Dialog open={uiStore.error !== null} onClose={handleDismiss}>
      <DialogTitle sx={{display: "flex", alignItems: "center", gap: 1}}>
        <ErrorOutlineIcon color="error"/>
        {ERROR_DIALOG.TITLE}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {uiStore.error}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDismiss}>{ERROR_DIALOG.DISMISS}</Button>
        <Button onClick={handleRetry} variant="contained" color="primary">
          {ERROR_DIALOG.RETRY}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default ErrorDialog;
