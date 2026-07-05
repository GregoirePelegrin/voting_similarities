import React from "react";
import {Select, MenuItem, Typography, Box, Tooltip} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";

const ConfigSetSelector: React.FC = observer(() => {
  const {uiStore} = rootStore;
  const {configSets, activeConfigSetId, activeConfigSet} = uiStore;

  if (configSets.length <= 1) return null;

  return (
    <Box sx={{ml: "auto", mr: 1}}>
      <Tooltip
        title={
          activeConfigSet
            ? `Oui/Oui: ${activeConfigSet.w_yes} · Non/Non: ${activeConfigSet.w_no} · Désaccord: ${activeConfigSet.w_mismatch} · Lissage m: ${activeConfigSet.m}`
            : ""
        }
      >
        <Select
          value={activeConfigSetId ?? ""}
          onChange={(e) => uiStore.setActiveConfigSetId(Number(e.target.value))}
          size="small"
          sx={{
            color: "inherit",
            bgcolor: "rgba(255,255,255,0.08)",
            "& .MuiSelect-icon": {color: "inherit"},
            "& .MuiOutlinedInput-notchedOutline": {border: "none"},
          }}
        >
          {configSets.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              <Box>
                <Typography variant="body2" sx={{lineHeight: 1.2}}>{s.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{lineHeight: 1.2}}>
                  Y:{s.w_yes} N:{s.w_no} D:{s.w_mismatch} m:{s.m}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
    </Box>
  );
});

export default ConfigSetSelector;