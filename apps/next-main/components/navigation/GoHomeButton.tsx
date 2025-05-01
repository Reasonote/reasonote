import {useRouter} from "next/navigation";

import {Home} from "@mui/icons-material";
import {
  Button,
  ButtonProps,
} from "@mui/material";

export function GoHomeButton(props: Partial<ButtonProps>){
    const router = useRouter();
    return (
        <Button
            onClick={() => {
                router.push("/app");
            }}
            startIcon={<Home/>}
            {...props}
        >
            Go Home
        </Button>
    );
}