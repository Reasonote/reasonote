import {
  Abc,
  Ballot,
  ListAlt,
  Numbers,
} from "@mui/icons-material";
import {
  MenuItem,
  Select,
  Stack,
} from "@mui/material";

export const JsonSchemaTypeSelect = ({
    type,
    onTypeChange
}: {
    type: string;
    onTypeChange: (event: any) => void;
}) => {
    return (
        <Select
            size="small"
            value={type}
            onChange={onTypeChange}
        >
            <MenuItem value="string">
                <Stack direction="row" gap={1}>
                    <Abc fontSize="small"/>
                    Text
                </Stack>
            </MenuItem>
            <MenuItem value="number">
                <Stack direction="row" gap={1}>
                    <Numbers fontSize="small" sx={{scale: '.9'}}/>
                    Number
                </Stack>
            </MenuItem>
            <MenuItem value="object">
                <Stack direction="row" gap={1} alignItems={"center"}>
                    <Ballot fontSize="small"/>
                    Object
                </Stack>
            </MenuItem>
            <MenuItem value="array">
                <Stack direction="row" gap={1} alignItems={"center"}>
                    <ListAlt fontSize="small" sx={{scale: '.9'}}/>
                    List
                </Stack>
            </MenuItem>
        </Select>
    );
}