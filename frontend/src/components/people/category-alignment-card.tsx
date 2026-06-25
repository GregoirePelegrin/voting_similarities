import React from "react";
import { Card, CardContent, Typography, Box, Tooltip } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { observer } from "mobx-react-lite";
import { CategoryAlignmentOut } from "../../api/types";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface CategoryAlignmentCardProps {
  alignments: CategoryAlignmentOut[];
}

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{ bgcolor: "#2A3142", p: 1.5, borderRadius: 1, boxShadow: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{d.category_name}</Typography>
      <Typography variant="caption" color="text.secondary">
        Alignment: {d.alignment >= 0 ? "+" : ""}{(d.alignment * 100).toFixed(1)}%
      </Typography>
    </Box>
  );
};

const CategoryAlignmentCard: React.FC<CategoryAlignmentCardProps> = observer(
  ({ alignments }) => {
    if (!alignments || alignments.length === 0) return null;

    const data = [...alignments]
      .map((a) => ({ ...a, alignment_pct: a.alignment * 100 }))
      .sort((a, b) => b.alignment_pct - a.alignment_pct);

    return (
      <Card sx={{ bgcolor: "background.paper" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6">Category Alignment</Typography>
            <Tooltip title="How well each category aligns this person with their own group versus other groups. Positive = fits their group, negative = differs from their group.">
              <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </Tooltip>
          </Box>
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 100, right: 40 }}>
              <XAxis type="number" tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
              <YAxis type="category" dataKey="category_name" width={90} tick={{ fill: "#9EAAB8", fontSize: 12 }} />
              <RTooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
              <Bar dataKey="alignment_pct" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.alignment_pct >= 0 ? "#59A14F" : "#E15759"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }
);

export default CategoryAlignmentCard;
