import {Txt} from "@/components/typography/Txt";

export function OL({children, ...rest}){
    return <Txt className={`pl-5 list-number ${rest.className ?? ''}`} {...rest}>
        {children}
    </Txt>
}