import React from "react";

import {motion} from "framer-motion";
import {useRouter} from "next/navigation";

import useIsSmallDevice from "@/clientOnly/hooks/useIsSmallDevice";
import {
  Box,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import {teal} from "@mui/material/colors";
import {
  ReasonoteLicensePlans,
  ReasonoteLicenseType,
} from "@reasonote/core";

import {GoHomeButton} from "../navigation/GoHomeButton";
import {Txt} from "../typography/Txt";

export interface FriendlyNotifierFeature {
  icon: string;
  label: string;
}

interface FriendlyNotifierContentProps {
  title: string;
  subtitle: string | React.ReactNode;
  features: FriendlyNotifierFeature[];
  licenseType: ReasonoteLicenseType;
  illustration?: string;
}


function FriendlyNotifierPrimaryActionButton({
  licenseType,
  onClick,
}: {
  licenseType: ReasonoteLicenseType;  
  onClick: () => void;
}){
  const licenseEntry = ReasonoteLicensePlans[licenseType];
  const upsell = licenseEntry?.upsell;

  return <Button 
    variant="contained" 
    color="primary" 
    sx={{
      px: 3,
      py: 1,
      borderRadius: 2,
      textTransform: 'none',
      fontSize: '1rem',
      background: `linear-gradient(45deg, ${teal[600]} 30%, ${teal['A400']} 100%)`,
      '&:hover': {
        background: `linear-gradient(45deg, ${teal[400]} 30%, ${teal['A200']} 90%)`,
        border: '1px solid white',
      },
      border: '1px solid white',
    }}
    onClick={onClick}
  >
    <Txt variant="body1" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
      {upsell?.upsellText ?? (licenseType === 'Reasonote-Anonymous' ?   
        'Create Free Account'
        : 
        'Start Free Trial'
      )}
    </Txt>
  </Button>
}

export function FriendlyNotifierContent({
  title,
  subtitle,
  features,
  licenseType,
  illustration,
}: FriendlyNotifierContentProps) {
  const router = useRouter();
  const isSmallDevice = useIsSmallDevice();

  return (
    <Stack spacing={isSmallDevice ? 1 : 3} alignItems="center">
      {illustration && (
        <Box sx={{ 
          position: 'relative', 
          width: '100%', 
          height: isSmallDevice ? 120 : 180,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: isSmallDevice ? 1 : 2
        }}>
          <img 
            src={illustration}
            alt={title}
            style={{ 
              maxWidth: isSmallDevice ? '80%' : '100%',
              maxHeight: isSmallDevice ? '75%' : '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      )}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Txt variant={isSmallDevice ? 'body1' : 'h6'} sx={{ fontWeight: 'bold' }} align="center" color="primary">
          {title}
        </Txt>
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Txt variant="body1" align="center" sx={{ maxWidth: 450 }}>
          {subtitle}
          <br/>
          {isSmallDevice ? null : <><br/></>}
          {licenseType === 'Reasonote-Anonymous' ? <><span>Create a <b>free</b> account to unlock:</span><br/></> : <><span>You can upgrade now to unlock:</span><br/></>}
          <Stack direction="row" spacing={1} sx={{ mt: 1, gap: isSmallDevice ? 0.5 : 1 }} alignItems="center" justifyContent="center" flexWrap="wrap">
            {features.map((feature, index) => (
              <div key={index}>
                <Chip 
                  color="primary" 
                  icon={<div>{feature.icon}</div>} 
                  label={`${feature.label}`} 
                  sx={{ 
                    fontSize: '0.8rem',
                  }}
                  size={isSmallDevice ? 'small' : 'medium'}
                />
              </div>
            ))}
          </Stack>
        </Txt>
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Stack 
          direction="row" 
          justifyContent="center" 
          spacing={2} 
          sx={{ mt: 2 }}
        >
          <GoHomeButton />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> 
            <FriendlyNotifierPrimaryActionButton 
              licenseType={licenseType} 
              onClick={() => {
                const licenseEntry = ReasonoteLicensePlans[licenseType];
                
                const upsell = licenseEntry?.upsell;
                const upsellEntry = upsell ? ReasonoteLicensePlans[upsell.upsellToType] : undefined;
                
                if (upsell) {
                  router.push(upsell.upsellPath ?? '/app/upgrade');
                }
              }}
            />
          </Box>
        </Stack>
      </motion.div>
    </Stack>
  );
} 