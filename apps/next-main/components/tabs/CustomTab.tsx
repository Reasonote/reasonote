import {Box} from "@mui/material";

export interface TabPanelProps {
    children?: React.ReactNode;
    currentValue: string;
    value: string;
    boxProps?: React.ComponentProps<typeof Box>;
    divProps?: React.ComponentProps<'div'>;
}

export function CustomTabPanel(props: TabPanelProps) {
    const { children, value, currentValue, boxProps, divProps } = props;
  
    return value === currentValue ? (
        <div
          role="tabpanel"
          // hidden={value !== currentValue}
          id={`simple-tabpanel-${value}`}
          aria-labelledby={`simple-tab-${value}`}
          {...divProps}
          style={{
            display: 'flex',
            ...divProps?.style,
          }}
          // sx={{
          //   width: '100%',
          //   height: '100%',
          //   overflow: 'scroll'
          // }}
        >
        <Box 
          {...boxProps}
          sx={{
            p: 1, 
            display: 'flex',
            width: '100%',
            ...boxProps?.sx
          }}>
          <div style={{display:'flex', width:'100%'}}>
            {children}
          </div>
        </Box>
        </div>
      ) : null;
}