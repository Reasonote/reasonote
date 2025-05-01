import {
  useEffect,
  useState,
} from "react";

import {DateTime} from "luxon";

import {useSupabase} from "@/components/supabase/SupabaseProvider";
import {
  Box,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

type DayActivity = {
  date: string;
  count: number;
};

const getColorIntensity = (count: number) => {
  // Define color intensities (from lightest to darkest)
  const colors = [
    'rgba(22, 140, 133, 0.5)',   // 1-2 activities
    'rgba(22, 160, 133, 0.6)',   // 3-4 activities
    'rgba(22, 160, 133, 0.7)',   // 5-6 activities
    'rgba(22, 160, 133, 0.8)',   // 7-8 activities
    'rgba(22, 160, 133, 0.9)',   // 9-10 activities
    'rgba(22, 160, 133, 1.0)',   // >10 activities
  ];

  if (count === 0) return 'rgba(255, 255, 255, 0.1)';
  if (count >= 10) return colors[5];
  return colors[Math.floor((count - 1) / 2)];
};

const formatDate = (date: string) => {
  return DateTime.fromISO(date).toFormat('LLL d, yyyy');
};

const formatCount = (count: number) => {
  if (count === 0) return 'No activities';
  if (count === 1) return '1 activity';
  return `${count} activities`;
};

const DayLabel = ({ day, sx }: { day: string, sx: any }) => (
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{
      fontSize: '0.5rem',
      width: '30px',
      textAlign: 'right',
      paddingRight: '8px',
      ...sx,
    }}
  >
    {day}
  </Typography>
);

const MonthLabel = ({ month, sx }: { month: string, sx: any }) => (
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{
      fontSize: '0.7rem',
      position: 'absolute',
      top: '-20px',
      ...sx,
    }}
  >
    {month}
  </Typography>
);

interface ActivityHeatmapProps {
  maxDays?: number; // Optional prop to limit the number of days shown
}

export const ActivityHeatmap = ({ maxDays = 365 }: ActivityHeatmapProps) => {
  const { supabase } = useSupabase();
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityData = async () => {
      const endDate = DateTime.now().endOf('day');
      const startDate = endDate.minus({ days: maxDays - 1 });

      const { data, error } = await supabase
        .from('user_activity_result')
        .select('*')
        .gte('created_date', startDate.toISO())
        .lte('created_date', endDate.toISO());

      if (error) {
        console.error('Error fetching activity data:', error);
        return;
      }

      // Group activities by day and count them
      const activityCounts = data.reduce((acc: { [key: string]: number }, item) => {
        const date = DateTime.fromISO(item.created_date).toISODate();
        if (!date) return acc;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Create array of days with activity counts
      const days: DayActivity[] = [];
      for (let i = 0; i < maxDays; i++) {
        const date = endDate.minus({ days: i }).toISODate();
        if (!date) continue;
        days.unshift({
          date,
          count: activityCounts[date] || 0,
        });
      }

      setActivityData(days);
      setLoading(false);
    };

    fetchActivityData();
  }, [supabase, maxDays]);

  if (loading) {
    return <Box>Loading activity data...</Box>;
  }

  // Organize data into weeks, starting from Sunday
  const weeks: (DayActivity | undefined)[][] = [];
  const endDate = DateTime.now().endOf('day');
  const startDate = endDate.minus({ days: maxDays - 1 });
  
  // Find the first Sunday before or on the start date
  let currentDate = startDate;
  while (currentDate.weekday !== 7) { // Luxon uses 7 for Sunday
    currentDate = currentDate.minus({ days: 1 });
  }

  // Build weeks array
  while (currentDate <= endDate) {
    let currentWeek: (DayActivity | undefined)[] = [];
    
    // Create a week from Sunday to Saturday
    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toISODate();
      const activity = activityData.find(a => a.date === dateStr);
     
      if (!dateStr) {
        console.error('No date string found for activity');
        continue;
      }

      currentWeek.push(activity || { date: dateStr, count: 0 });
      currentDate = currentDate.plus({ days: 1 });
    }

    weeks.push(currentWeek);
  }

  // Day labels for Monday, Wednesday, Friday
  const dayLabels = ['Mon', 'Wed', 'Fri'];

  // Get month labels
  const monthLabels = weeks.map((week) => {
    const firstDay = week[0];
    if (!firstDay) return null;
    
    const date = DateTime.fromISO(firstDay.date);
    const isFirstOfMonth = date.day <= 7 && (
      weeks.indexOf(week) === 0 || 
      DateTime.fromISO(weeks[weeks.indexOf(week) - 1][0]?.date || '').month !== date.month
    );
    
    return isFirstOfMonth ? date.toFormat('LLL') : null;
  });

  return (
    <Stack spacing={1}>
      <Typography variant="h6">Activity</Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Stack gap="2px" py={1}>
          {dayLabels.map((day, index) => (
            <Box key={day}>
              <DayLabel 
                day={day} 
                sx={{ 
                  height: '10px',
                  ...(index > 0 && { mt: index === 1 ? 1 : index === 2 ? 2 : 3 }),
                }} 
              />
            </Box>
          ))}
        </Stack>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            gap: '2px',
            overflow: 'auto',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 1,
            py: 1,
            px: 1
          }}
        >
          {/* Month labels */}
          {monthLabels.map((month, index) => month && (
            <MonthLabel
              key={index}
              month={month}
              sx={{
                left: `${index * 12}px`,
                position: 'absolute',
                top: '-20px',
              }}
            />
          ))}
          {/* Activity squares */}
          {weeks.map((week, weekIndex) => (
            <Stack key={weekIndex} spacing="2px">
              {week.map((day, dayIndex) => (
                <Tooltip
                  key={dayIndex}
                  title={day ? `${formatCount(day.count)} on ${formatDate(day.date)}` : ''}
                  arrow
                >
                  <Box
                    sx={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: day ? getColorIntensity(day.count) : 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '2px',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Stack>
          ))}
        </Box>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" color="text.secondary">Less</Typography>
        {[0, 2, 4, 6, 8, 10].map((count) => (
          <Box
            key={count}
            sx={{
              width: '10px',
              height: '10px',
              backgroundColor: getColorIntensity(count),
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2px',
            }}
          />
        ))}
        <Typography variant="caption" color="text.secondary">More</Typography>
      </Stack>
    </Stack>
  );
}; 