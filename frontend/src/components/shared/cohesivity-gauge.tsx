import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

interface CohesivityGaugeProps {
  value: number;
  color: string;
  size?: number;
  label?: string;
}

const CohesivityGauge: React.FC<CohesivityGaugeProps> = ({ value, color, size = 120, label = "Cohesivity" }) => {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={5}
          sx={{ color: "rgba(255,255,255,0.06)" }}
        />
        <CircularProgress
          variant="determinate"
          value={pct}
          size={size}
          thickness={5}
          sx={{ color, position: "absolute", left: 0, top: 0 }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {pct.toFixed(1)}%
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
};

export default CohesivityGauge;
