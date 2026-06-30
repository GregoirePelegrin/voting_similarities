import React from "react";
import {Box, Typography} from "@mui/material";
import {DATA_COLORS} from "../../theme";

interface SimilarityBarProps {
  value: number;
  color?: string;
  label?: string;
  showSign?: boolean;
}

const SimilarityBar: React.FC<SimilarityBarProps> = ({value, color = DATA_COLORS.primary, label, showSign}) => {
  const pct = Math.max(0, Math.min(1, Math.abs(value))) * 100;
  const displayValue = showSign && value < 0
    ? `${(value * 100).toFixed(1)}%`
    : `${(Math.abs(value) * 100).toFixed(1)}%`;

  return (
    <Box sx={{display: "flex", alignItems: "center", gap: 1, width: "100%"}}>
      {label && (
        <Typography variant="body2"
                    sx={{minWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
          {label}
        </Typography>
      )}
      <Box sx={{flex: 1, height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.08)", overflow: "hidden"}}>
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
      <Typography variant="body2" sx={{minWidth: 50, textAlign: "right", fontVariantNumeric: "tabular-nums"}}>
        {displayValue}
      </Typography>
    </Box>
  );
};

export default SimilarityBar;
