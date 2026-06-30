import React from "react";
import { Card, CardContent, Typography, Box, LinearProgress, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import { DeterminantCategoryOut } from "../../api/types";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DETERMINANT_CATEGORIES } from "../../constants/fr";

interface DeterminantCategoriesCardProps {
  categories: DeterminantCategoryOut[];
}

const DeterminantCategoriesCard: React.FC<DeterminantCategoriesCardProps> = observer(
  ({ categories }) => {
    if (!categories || categories.length === 0) return null;

    const maxIg = Math.max(...categories.map((c) => c.info_gain));

    return (
      <Card sx={{bgcolor: "background.paper"}}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6">{DETERMINANT_CATEGORIES.HEADING}</Typography>
            <Tooltip title={DETERMINANT_CATEGORIES.TOOLTIP}>
              <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </Tooltip>
          </Box>

          {categories.map((cat) => (
            <Box key={cat.category_id} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {cat.category_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(cat.normalized_ig * 100).toFixed(1)}% {DETERMINANT_CATEGORIES.UNCERTAINTY}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(cat.info_gain / maxIg) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.08)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    bgcolor: "#4A90D9",
                  },
                }}
              />
              <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {DETERMINANT_CATEGORIES.ACCURACY} {(cat.accuracy * 100).toFixed(0)}%
                </Typography>
                {cat.most_confused_with_name && (
                  <Typography variant="caption" color="text.secondary">
                    {DETERMINANT_CATEGORIES.MOST_CONFUSED} {cat.most_confused_with_name}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }
);

export default DeterminantCategoriesCard;
