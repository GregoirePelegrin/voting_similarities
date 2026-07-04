import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  Label,
} from "recharts";
import {Box, Typography, Chip} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {observer} from "mobx-react-lite";
import {EmbeddingPointOut} from "../../api/types";
import {GROUPS_SCATTER} from "../../constants/fr";
import {APP_CONFIG} from "../../constants/config";
import {DATA_COLORS} from "../../theme";

interface GroupsScatterProps {
  points: EmbeddingPointOut[];
  stress: number;
  categoriesLabel?: string;
}

const CustomTooltip: React.FC<any> = ({active, payload}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{bgcolor: "#2A3142", p: 1.5, borderRadius: 1, boxShadow: 2, border: "1px solid rgba(255,255,255,0.1)"}}>
      <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
        <Box sx={{width: 10, height: 10, borderRadius: "50%", bgcolor: d.color}}/>
        <Typography variant="body2" sx={{fontWeight: 500}}>{d.name}</Typography>
      </Box>
    </Box>
  );
};

const GroupsScatter: React.FC<GroupsScatterProps> = observer(({points, stress, categoriesLabel}) => {
  const navigate = useNavigate();

  const stressColor = stress < APP_CONFIG.STRESS_THRESHOLD_GOOD ? DATA_COLORS.positive : stress < APP_CONFIG.STRESS_THRESHOLD_FAIR ? DATA_COLORS.warning : DATA_COLORS.negative;

  return (
    <Box>
      <Box sx={{display: "flex", alignItems: "center", gap: 2, mb: 1}}>
        <Typography variant="h6">{GROUPS_SCATTER.HEADING}</Typography>
        <Chip
          size="small"
          label={`Stress: ${(stress * 100).toFixed(1)}%`}
          sx={{bgcolor: stressColor + "20", color: stressColor, borderColor: stressColor + "60"}}
          variant="outlined"
        />
        {categoriesLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ml: "auto", fontStyle: "italic"}}>
            {categoriesLabel}
          </Typography>
        )}
      </Box>
      <Box sx={{aspectRatio: 3/2, mx: "auto"}}>
        <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{top: 10, right: 20, bottom: 10, left: 20}}>
          <XAxis type="number" dataKey="x" name="x" tick={{fill: DATA_COLORS.neutral, fontSize: 11}}
                 axisLine={{stroke: "rgba(255,255,255,0.1)"}} tickLine={false}>
            <Label value={GROUPS_SCATTER.X_LABEL} position="bottom" fill={DATA_COLORS.neutral} fontSize={11} offset={-5}/>
          </XAxis>
          <YAxis type="number" dataKey="y" name="y" tick={{fill: DATA_COLORS.neutral, fontSize: 11}}
                 axisLine={{stroke: "rgba(255,255,255,0.1)"}} tickLine={false}>
            <Label value={GROUPS_SCATTER.Y_LABEL} position="left" angle={-90} fill={DATA_COLORS.neutral} fontSize={11} offset={5} style={{textAnchor: "middle"}}/>
          </YAxis>
          <ZAxis range={[200]}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Scatter
            data={points}
            onClick={(data) => {
              if (data?.id) navigate(`/groups/${data.id}`);
            }}
            style={{cursor: "pointer"}}
          >
            {points.map((p, i) => (
              <Cell key={i} fill={p.color} fillOpacity={0.85} stroke="#fff" strokeWidth={1}/>
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      </Box>
    </Box>
  );
});

export default GroupsScatter;
