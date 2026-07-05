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
import {EmbeddingPointOut, BarycenterOut} from "../../api/types";
import {VOTERS_SCATTER} from "../../constants/fr";
import {APP_CONFIG} from "../../constants/config";
import {DATA_COLORS} from "../../theme";

interface EmbeddingScatterProps {
  points: EmbeddingPointOut[];
  barycenters: BarycenterOut[];
  stress: number;
  categoriesLabel?: string;
}

const UnifiedTooltip: React.FC<any> = ({active, payload}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isBarycenter = "member_count" in d;
  return (
    <Box sx={{bgcolor: "#2A3142", p: 1.5, borderRadius: 1, boxShadow: 2, border: "1px solid rgba(255,255,255,0.1)"}}>
      <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
        <Box sx={{width: 10, height: 10, borderRadius: "50%", bgcolor: d.color}}/>
        <Typography variant="body2" sx={{fontWeight: 500}}>{d.name_short || d.name}</Typography>
      </Box>
      {isBarycenter ? (
        <Typography variant="caption" color="text.secondary">
          {d.member_count} {VOTERS_SCATTER.MEMBERS_BC}
        </Typography>
      ) : (
        d.group_name && (
          <Typography variant="caption" sx={{color: d.group_color || d.color}}>
            {d.group_name_short || d.group_name}
          </Typography>
        )
      )}
    </Box>
  );
};

const EmbeddingScatter: React.FC<EmbeddingScatterProps> = observer(({points, barycenters, stress, categoriesLabel}) => {
  const navigate = useNavigate();

  const stressColor = stress < APP_CONFIG.STRESS_THRESHOLD_GOOD ? DATA_COLORS.positive : stress < APP_CONFIG.STRESS_THRESHOLD_FAIR ? DATA_COLORS.warning : DATA_COLORS.negative;

  return (
    <Box>
      <Box sx={{display: "flex", alignItems: "center", gap: 2, mb: 1}}>
        <Typography variant="h6">{VOTERS_SCATTER.HEADING}</Typography>
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
            <Label value={VOTERS_SCATTER.X_LABEL} position="bottom" fill={DATA_COLORS.neutral} fontSize={11} offset={-5}/>
          </XAxis>
          <YAxis type="number" dataKey="y" name="y" tick={{fill: DATA_COLORS.neutral, fontSize: 11}}
                 axisLine={{stroke: "rgba(255,255,255,0.1)"}} tickLine={false}>
            <Label value={VOTERS_SCATTER.Y_LABEL} position="left" angle={-90} fill={DATA_COLORS.neutral} fontSize={11} offset={5} style={{textAnchor: "middle"}}/>
          </YAxis>
          <ZAxis range={[40]}/>
          <Tooltip content={<UnifiedTooltip/>}/>
          <Scatter
            name="voters"
            data={points}
            onClick={(data: any) => {
              if (data?.id) navigate(`/voters/${data.id}`);
            }}
            style={{cursor: "pointer"}}
          >
            {points.map((p, i) => (
              <Cell key={i} fill={p.color} fillOpacity={0.7} stroke={p.color} strokeWidth={0.5}/>
            ))}
          </Scatter>
          <Scatter
            name="barycenters"
            data={barycenters.map((b) => ({...b, z: 120}))}
            shape="diamond"
            onClick={(data: any) => {
              if (data?.group_id) navigate(`/groups/${data.group_id}`);
            }}
            style={{cursor: "pointer"}}
          >
            {barycenters.map((b, i) => (
              <Cell key={i} fill={b.color} fillOpacity={0.9} stroke="#fff" strokeWidth={1.5}/>
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      </Box>
    </Box>
  );
});

export default EmbeddingScatter;
