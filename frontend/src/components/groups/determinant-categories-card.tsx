import React from "react";
import {Card, CardContent, Typography, Box, LinearProgress, Tooltip} from "@mui/material";
import {DeterminantCategoryOut} from "../../api/types";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {DETERMINANT_CATEGORIES} from "../../constants/fr";
import {SortMode} from "../../stores/ui-store";

interface DeterminantCategoriesCardProps {
  categories: DeterminantCategoryOut[];
  sortMode?: SortMode;
}

const DeterminantCategoriesCard: React.FC<DeterminantCategoriesCardProps> = ({categories, sortMode = "value"}) => {
  if (!categories || categories.length === 0) return null;

  const sorted = [...categories].sort((a, b) =>
    sortMode === "name"
      ? a.category_name.localeCompare(b.category_name)
      : b.info_gain - a.info_gain
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{display: "flex", alignItems: "center", gap: 1, mb: 2}}>
          <Typography variant="h6">{DETERMINANT_CATEGORIES.HEADING}</Typography>
          <Tooltip title={DETERMINANT_CATEGORIES.TOOLTIP}>
            <InfoOutlinedIcon sx={{fontSize: 18, color: "text.secondary"}}/>
          </Tooltip>
        </Box>

        {sorted.map((cat) => (
          <Tooltip key={cat.category_id} followCursor title={
            <Box sx={{display: "flex", flexDirection: "column"}}>
              {cat.most_confused_with_name && (
                <Typography variant="caption">
                  {DETERMINANT_CATEGORIES.MOST_CONFUSED} : {cat.most_confused_with_name}
                </Typography>
              )}
              <Typography variant="caption">
                {DETERMINANT_CATEGORIES.PRECISION} : {(cat.accuracy * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption">
                {DETERMINANT_CATEGORIES.KL_DIVERGENCE} : {cat.kl_divergence.toFixed(3)}
              </Typography>
            </Box>
          }>
            <Box sx={{mb: 2}}>
              <Box sx={{display: "flex", justifyContent: "space-between", mb: 0.5}}>
                <Typography variant="body2" sx={{fontWeight: 500}}>
                  {cat.category_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(cat.normalized_ig * 100).toFixed(1)}% {DETERMINANT_CATEGORIES.UNCERTAINTY}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={cat.normalized_ig * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.08)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    bgcolor: `hsl(${cat.normalized_ig * 120}, 75%, ${32 + cat.normalized_ig * 18}%)`,
                  },
                }}
              />
            </Box>
          </Tooltip>
        ))}
      </CardContent>
    </Card>
  );
};

export default DeterminantCategoriesCard;
