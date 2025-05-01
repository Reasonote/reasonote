import React, {useState} from "react";

import {Delete} from "@mui/icons-material";
import {
  Button,
  ButtonProps,
  IconButton,
  IconButtonProps,
  Menu,
  MenuItemProps,
  MenuProps,
  Stack,
  SvgIcon,
  SvgIconProps,
} from "@mui/material";

export interface IconButtonDeleteProps {
  onConfirmDelete?: () => any; // Callback function for the delete action
  iconButtonProps?: IconButtonProps; // Optional props for IconButton
  svgIconProps?: SvgIconProps; // Optional props for SVGIcon (DeleteIcon in this case)
  menuProps?: MenuProps; // Optional props for Menu
  menuItemProps?: MenuItemProps; // Optional props for MenuItem
  confirmButtonProps?: ButtonProps; // Optional props for the confirm delete button
}

export const IconButtonDelete: React.FC<IconButtonDeleteProps> = ({
  onConfirmDelete,
  iconButtonProps,
  svgIconProps,
  menuProps,
  menuItemProps,
  confirmButtonProps,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    onConfirmDelete?.(); // Execute the provided delete function
    handleClose(); // Close the menu
  };

  return (
    <>
      <IconButton {...iconButtonProps} onClick={handleClick}>
        {/* You can replace DeleteIcon with a dynamic component if needed */}
        <SvgIcon {...svgIconProps} component={Delete}/>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        {...menuProps}
      >
        <Stack sx={{padding: '5px'}} alignItems={'center'} direction={'column'} gap={1}>
            Are You Sure?
            <Button {...confirmButtonProps} color={'error'} variant="contained" onClick={handleDelete}>Confirm Delete</Button>
        </Stack>
        
        {/* <MenuItem {...menuItemProps}>
          
        </MenuItem> */}
      </Menu>
    </>
  );
};