import {
  Txt,
  TxtProps,
} from "@/components/typography/Txt";

export interface RoleplayIntroCardHeaderProps {
    icon: React.ReactNode;
    title: string;
    sx?: TxtProps['sx'];
    slots?: {
        txt?: TxtProps;
    }
}


export function RoleplayIntroCardHeader({ icon, title, sx, slots }: RoleplayIntroCardHeaderProps) {
    return <Txt
        startIcon={icon}
        variant={"h6"}
        sx={{
            ...sx,
        }}
        {...slots?.txt}
    >
        {title}
    </Txt>
}
