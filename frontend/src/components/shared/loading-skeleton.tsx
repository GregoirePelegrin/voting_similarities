import React from "react";
import { Box, Skeleton } from "@mui/material";

export const CardSkeleton: React.FC = () => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="40%" height={32} />
    <Skeleton variant="text" width="60%" height={24} />
    <Skeleton variant="rectangular" width="100%" height={120} sx={{ mt: 2, borderRadius: 1 }} />
  </Box>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Box>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="text" width="100%" height={40} sx={{ mb: 0.5 }} />
    ))}
  </Box>
);
