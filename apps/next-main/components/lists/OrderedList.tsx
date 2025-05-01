import { Stack } from "@mui/material";

interface OrderedListProps {
  children: React.ReactNode[];
  listStackProps?: React.ComponentProps<typeof Stack>;
  listItemProps?: React.ComponentProps<typeof Stack>;
  marker: (n: React.ReactNode, idx: number) => React.ReactNode;
}

export function OrderedList({
  children,
  listStackProps,
  listItemProps,
  marker,
}: OrderedListProps) {
  return (
    <Stack {...listStackProps} direction="column">
      {children.map((child, i) => {
        return (
          <Stack direction="row" alignItems="center" {...listItemProps}>
            {marker(child, i)}
            {child}
          </Stack>
        );
      })}
    </Stack>
  );
}
