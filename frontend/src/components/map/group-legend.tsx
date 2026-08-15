import React from "react";
import {Box, Typography} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {sortGroupsByPoliticalOrder} from "../../constants/groups";

interface GroupLegendItem {
  id?: number;
  name: string;
  name_short?: string | null;
  color: string;
}

interface GroupLegendProps {
  items: GroupLegendItem[];
}

const GroupLegend: React.FC<GroupLegendProps> = ({items}) => {
  const navigate = useNavigate();
  const sorted = sortGroupsByPoliticalOrder(items);
  return (
    <Box sx={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 0.5, mt: 1}}>
      {sorted.map((item) => (
        <Box
          key={item.id ?? item.name}
          onClick={() => item.id && navigate(`/groups/${item.id}`)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 4,
            cursor: item.id ? "pointer" : "default",
            "&:hover": item.id ? {bgcolor: "rgba(255,255,255,0.06)"} : undefined,
          }}
        >
          <Box sx={{width: 10, height: 10, borderRadius: "50%", bgcolor: item.color}}/>
          <Typography variant="body2" sx={{fontWeight: 500}}>
            {item.name_short || item.name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default GroupLegend;
