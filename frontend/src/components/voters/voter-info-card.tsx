import React from "react";
import {Typography, Box} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {VOTER_INFO} from "../../constants/fr";

interface VoterInfoCardProps {
  role: string | null;
  commission: string | null;
  circonscription: string | null;
}

const VoterInfoCard: React.FC<VoterInfoCardProps> = ({role, commission, circonscription}) => {
  if (!role && !commission && !circonscription) return null;

  return (
    <Box sx={{display: "flex", flexDirection: "column", gap: 1.5}}>
        {role && (
          <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
            <PersonIcon sx={{fontSize: 18, color: "text.secondary"}}/>
            <Typography variant="body2">
              <strong>{VOTER_INFO.ROLE}</strong> {role}
            </Typography>
          </Box>
        )}
        {commission && (
          <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
            <BusinessIcon sx={{fontSize: 18, color: "text.secondary"}}/>
            <Typography variant="body2">
              <strong>{VOTER_INFO.COMMISSION}</strong> {commission}
            </Typography>
          </Box>
        )}
        {circonscription && (
          <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
            <LocationOnIcon sx={{fontSize: 18, color: "text.secondary"}}/>
            <Typography variant="body2">
              <strong>{VOTER_INFO.CIRCONSCRIPTION}</strong> {circonscription}
            </Typography>
          </Box>
        )}
    </Box>
  );
};

export default VoterInfoCard;
