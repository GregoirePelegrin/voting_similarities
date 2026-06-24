import React from "react";
import { Box, Typography } from "@mui/material";

interface SimilarityBarProps {
  value: number;
  color?: string;
  label?: string;
}

const SimilarityBar: React.FC<SimilarityBarProps> = ({ value, color = "#4A90D9", label }) => {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      {label && (
        <Typography variant="body2" sx={{ minWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </Typography>
      )}
      <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <Box
          sx={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 4,
            bgcolor: color,
            transition: "width 0.6s ease-out",
          }}
        />
      </Box>
      <Typography variant="body2" sx={{ minWidth: 45, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {(value * 100).toFixed(1)}%
      </Typography>
    </Box>
  );
};

export default SimilarityBar;
