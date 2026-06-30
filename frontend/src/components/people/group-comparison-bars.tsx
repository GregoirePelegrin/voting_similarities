import React from "react";
import { Card, CardContent, Typography, Box, Tooltip } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell } from "recharts";
import { GroupComparisonOut } from "../../api/types";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { GROUP_COMPARISON } from "../../constants/fr";
import { DATA_COLORS } from "../../theme";

interface GroupComparisonBarsProps {
  comparisons: GroupComparisonOut[];
}

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{ bgcolor: "#2A3142", p: 1.5, borderRadius: 1, boxShadow: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{d.group_name}</Typography>
      <Typography variant="caption" color="text.secondary">
        Similarity: {(d.similarity * 100).toFixed(1)}% &middot; Confidence: {(d.confidence * 100).toFixed(0)}% &middot; Shared: {d.shared_count}
      </Typography>
    </Box>
  );
};

const GroupComparisonBars: React.FC<GroupComparisonBarsProps> = ({ comparisons }) => {
    if (!comparisons || comparisons.length === 0) return null;
    const data = [...comparisons].sort((a, b) => b.similarity - a.similarity);

    return (
      <Card sx={{ bgcolor: "background.paper" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6">{GROUP_COMPARISON.HEADING}</Typography>
            <Tooltip title={GROUP_COMPARISON.TOOLTIP}>
              <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </Tooltip>
          </Box>
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 100, right: 40 }}>
              <XAxis type="number" domain={[0, "auto"]} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="group_name" width={90} tick={{ fill: DATA_COLORS.neutral, fontSize: 12 }} />
              <RTooltip content={<CustomTooltip />} />
              <Bar dataKey="similarity" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.group_color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
};

export default GroupComparisonBars;
