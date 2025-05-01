import {
  Card,
  Grid,
  Typography,
} from "@mui/material";

export const ExperienceCard = ({ icon, title, description, onClick, cardProps, backgroundColor }) => (
    <Grid item xs={8} sm={5} md={5} minWidth={'300px'}>
      <Card
        {...cardProps}
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: backgroundColor ?? 'black',
          color: (theme) => theme.palette.primary.contrastText,
          justifyContent: 'center',
          padding: 3,
          transition: 'transform 0.3s, box-shadow 0.3s, border 0.1s',
          border: '3px solid transparent',
          borderRadius: '10px',
          position: 'relative',
          overflow: 'hidden',
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
            ...cardProps?.sx?.['@keyframes shimmer'],
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: (theme) => `linear-gradient(45deg, ${theme.palette.background.paper}00 0%, ${theme.palette.background.paper}0D 50%, ${theme.palette.background.paper}00 100%)`,
            transform: 'translateX(-100%)',
            ...cardProps?.sx?.['&::before'],
          },
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: (theme) => theme.shadows[10],
            border: (theme) => `3px solid ${theme.palette.divider}`,
            '&::before': {
              animation: 'shimmer 0.6s forwards',
            },
            ...cardProps?.sx?.['&:hover'],
          },
          ...cardProps?.sx,
        }}
      >
        {icon}
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Typography variant="body1" align="center">{description}</Typography>
      </Card>
    </Grid>
  );