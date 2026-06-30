import React, {useState} from "react";
import {Card, Typography, Box, Collapse, IconButton} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {PERSON_INFO} from "../../constants/fr";

interface PersonInfoCardProps {
  role: string | null;
  commission: string | null;
  circonscription: string | null;
}

const PersonInfoCard: React.FC<PersonInfoCardProps> = ({role, commission, circonscription}) => {
  const [expanded, setExpanded] = useState(false);

  if (!role && !commission && !circonscription) return null;

  const summary = [role, commission, circonscription].filter(Boolean).join(" · ");

  return (
    <Card sx={{bgcolor: "background.paper", mb: 3}}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="body2" color="text.secondary" sx={{flex: 1}}>
          {summary}
        </Typography>
        <IconButton size="small" sx={{ml: 1}}>
          {expanded ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1}}>
          {role && (
            <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
              <PersonIcon sx={{fontSize: 18, color: "text.secondary"}}/>
              <Typography variant="body2">
                <strong>{PERSON_INFO.ROLE}</strong> {role}
              </Typography>
            </Box>
          )}
          {commission && (
            <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
              <BusinessIcon sx={{fontSize: 18, color: "text.secondary"}}/>
              <Typography variant="body2">
                <strong>{PERSON_INFO.COMMISSION}</strong> {commission}
              </Typography>
            </Box>
          )}
          {circonscription && (
            <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
              <LocationOnIcon sx={{fontSize: 18, color: "text.secondary"}}/>
              <Typography variant="body2">
                <strong>{PERSON_INFO.CIRCONSCRIPTION}</strong> {circonscription}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  );
};

export default PersonInfoCard;
