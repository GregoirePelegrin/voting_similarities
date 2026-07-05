import React from "react";
import {Card, CardContent, Typography, Box} from "@mui/material";
import {BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell} from "recharts";
import {DeterminantCategoryOut} from "../../api/types";
import {DETERMINANT_CATEGORIES} from "../../constants/fr";
import {SortMode} from "../../stores/ui-store";
import {redGreyGreenGradient} from "../../utils/colors";
import {DATA_COLORS} from "../../theme";

interface DeterminantCategoriesCardProps {
  categories: DeterminantCategoryOut[];
  sortMode?: SortMode;
  categoriesLabel?: string;
}

const CustomTooltip: React.FC<any> = ({active, payload}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{bgcolor: "#2A3142", p: 1.5, borderRadius: 1, boxShadow: 2}}>
      <Typography variant="body2" sx={{fontWeight: 500}}>{d.category_name}</Typography>
      <Typography variant="caption" color="text.secondary">
        Gain d'info. normalisé : {(d.normalized_ig * 100).toFixed(1)}%
      </Typography>
      <br/>
      <Typography variant="caption" color="text.secondary">
        {DETERMINANT_CATEGORIES.KL_DIVERGENCE} : {d.kl_divergence.toFixed(4)}
      </Typography>
      <br/>
      <Typography variant="caption" color="text.secondary">
        Précision : {(d.accuracy * 100).toFixed(1)}% · Info. Gain brut : {d.info_gain.toFixed(4)}
      </Typography>
      {d.most_confused_with_name && (
        <>
          <br/>
          <Typography variant="caption" color="text.secondary">
            {DETERMINANT_CATEGORIES.MOST_CONFUSED} : {d.most_confused_with_name}
          </Typography>
        </>
      )}
    </Box>
  );
};

const DeterminantCategoriesCard: React.FC<DeterminantCategoriesCardProps> = ({categories, sortMode = "value", categoriesLabel}) => {
  if (!categories || categories.length === 0) return null;

  const data = [...categories].sort((a, b) =>
      sortMode === "name"
        ? a.category_name.localeCompare(b.category_name)
        : b.normalized_ig - a.normalized_ig
    );

  return (
    <Card>
      <CardContent>
        <Box sx={{display: "flex", alignItems: "center", gap: 2, mb: 2}}>
          <Typography variant="h6">{DETERMINANT_CATEGORIES.HEADING}</Typography>
          {categoriesLabel && (
            <Typography variant="caption" color="text.secondary" sx={{ml: "auto", fontStyle: "italic"}}>
              {categoriesLabel}
            </Typography>
          )}
        </Box>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{left: 100, right: 40}}>
            <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}/>
            <YAxis type="category" dataKey="category_name" width={90} tick={{fill: DATA_COLORS.neutral, fontSize: 12}}/>
            <RTooltip content={<CustomTooltip/>}/>
            <Bar dataKey="normalized_ig" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((d, i) => (
                <Cell key={i} fill={redGreyGreenGradient(d.normalized_ig)}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DeterminantCategoriesCard;
