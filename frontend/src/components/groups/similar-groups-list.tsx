import React from "react";
import {useNavigate} from "react-router-dom";
import {Card, CardContent, Typography, Box} from "@mui/material";
import {SimilarGroupOut} from "../../api/types";
import SimilarityBar from "../shared/similarity-bar";
import {SIMILAR_GROUPS} from "../../constants/fr";
import {SortMode} from "../../stores/ui-store";

interface SimilarGroupsListProps {
  groups: SimilarGroupOut[];
  sortMode?: SortMode;
  categoriesLabel?: string;
}

const SimilarGroupsList: React.FC<SimilarGroupsListProps> = ({groups, sortMode = "value", categoriesLabel}) => {
  const navigate = useNavigate();
  if (!groups || groups.length === 0) return null;
  const sorted = [...groups].sort((a, b) =>
    sortMode === "name" ? a.name.localeCompare(b.name) : b.similarity - a.similarity
  );
  return (
    <Card>
      <CardContent>
        <Box sx={{display: "flex", alignItems: "center", gap: 2, mb: 2}}>
          <Typography variant="h6">{SIMILAR_GROUPS.HEADING}</Typography>
          {categoriesLabel && (
            <Typography variant="caption" color="text.secondary" sx={{ml: "auto", fontStyle: "italic"}}>
              {categoriesLabel}
            </Typography>
          )}
        </Box>
        <Box>
          {sorted.map((g) => (
            <Box key={g.id} sx={{mb: 1.5, cursor: "pointer"}} onClick={() => navigate(`/groups/${g.id}`)}>
              <Box sx={{display: "flex", alignItems: "center", gap: 1, mb: 0.5}}>
                <Box sx={{width: 10, height: 10, borderRadius: "50%", bgcolor: g.color}}/>
                <Typography variant="body2">{g.name}</Typography>
              </Box>
              <SimilarityBar value={g.similarity} color={g.color}/>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SimilarGroupsList;
