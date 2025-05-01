import React from "react";

import _ from "lodash";

import {Whatshot} from "@mui/icons-material";
import {
  Card,
  Stack,
  Typography,
} from "@mui/material";

import {
  highMedLow,
  HighMedLowChip,
} from "../HighMedLowChip";
import {SwotItemComponent} from "../SwotItemComponent";
import {swotConfigs} from "../utils/swotConfigs";

export const SwotGroupComponent = ({ typeName, swotAnalysisResultData }) => {
    return (
        <Card sx={{ padding: '10px' }} elevation={10}>
            <Stack gap={1}>
                <Stack direction={'row'} gap={1} alignItems={'center'}>
                    {swotConfigs[typeName].icon}
                    <Typography variant="h6">{swotConfigs[typeName].title}:</Typography>
                </Stack>
                <Stack paddingLeft="15px">
                    {swotAnalysisResultData &&
                        Object.entries(_.groupBy(swotAnalysisResultData?.swotitems.filter((swotItem) => swotItem.item.type === typeName), (swotItem) => swotItem.item.impact))
                            .sort(([a], [b]) => highMedLow.indexOf(a as any) - highMedLow.indexOf(b as any))
                            .map(([impact, swotItems]) => (
                                <Stack gap={1}>
                                    <Stack direction={'row'} gap={1} alignItems={'center'}>
                                        <HighMedLowChip label={<Whatshot fontSize="small" />} value={impact} chipOverrides={{ size: 'small' }} colorOverride={undefined} />
                                        <Typography variant="body2">{_.upperFirst(impact)} Impact</Typography>
                                    </Stack>
                                    <Stack paddingLeft="15px">
                                        {swotItems.map((swotItem, i) => (
                                            <SwotItemComponent key={i} swotItem={swotItem} />
                                        ))}
                                    </Stack>
                                </Stack>
                            ))}
                </Stack>
            </Stack>
        </Card>
    );
};