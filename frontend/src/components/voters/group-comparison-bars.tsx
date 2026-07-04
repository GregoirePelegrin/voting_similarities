import React from "react";
import {useNavigate} from "react-router-dom";
import {Card, CardContent, Typography, Box} from "@mui/material";
import {BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell} from "recharts";
import {GroupComparisonOut} from "../../api/types";
import {GROUP_COMPARISON} from "../../constants/fr";
import {DATA_COLORS} from "../../theme";

import {SortMode} from "../../stores/ui-store";

interface GroupComparisonBarsProps {
  comparisons: GroupComparisonOut[];
  sortMode?: SortMode;
  categoriesLabel?: string;
  heading?: string;
}

const CustomTooltip: React.FC<any> = ({active, payload}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{bgcolor: "#2A3142", p: 1.5, borderRadius: 1, boxShadow: 2}}>
      <Typography variant="body2" sx={{fontWeight: 500}}>{d.group_name}</Typography>
      <Typography variant="caption" color="text.secondary">
        {GROUP_COMPARISON.SIMILARITY}: {(d.similarity * 100).toFixed(1)}% · {GROUP_COMPARISON.CONFIDENCE}: {(d.confidence * 100).toFixed(0)}
      </Typography>
    </Box>
  );
};

const GroupComparisonBars: React.FC<GroupComparisonBarsProps> = ({comparisons, sortMode = "value", categoriesLabel, heading}) => {
  const navigate = useNavigate();
  if (!comparisons || comparisons.length === 0) return null;
  const data = [...comparisons].sort((a, b) =>
    sortMode === "name"
      ? a.group_name.localeCompare(b.group_name)
      : b.similarity - a.similarity
  );

  return (
    <Card sx={{height: "100%"}}>
      <CardContent>
        <Box sx={{display: "flex", alignItems: "center", gap: 2, mb: 2}}>
          <Typography variant="h6">{heading || GROUP_COMPARISON.HEADING}</Typography>
          {categoriesLabel && (
            <Typography variant="caption" color="text.secondary" sx={{ml: "auto", fontStyle: "italic"}}>
              {categoriesLabel}
            </Typography>
          )}
        </Box>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{left: 100, right: 40}}>
            <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}/>
            <YAxis type="category" dataKey="group_name" width={90} tick={{fill: DATA_COLORS.neutral, fontSize: 12}}/>
            <RTooltip content={<CustomTooltip/>}/>
            <Bar dataKey="similarity" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.group_color} onClick={() => navigate(`/groups/${d.group_id}`)} style={{cursor: "pointer"}}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default GroupComparisonBars;
