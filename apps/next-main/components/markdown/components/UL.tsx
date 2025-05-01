import {Txt} from "@/components/typography/Txt";

export function UL({children, ...rest}){
    return <Txt {...rest} className={`pl-5 list-disc ul:list-revert ${rest.className ?? ''}`} >
        {children}
    </Txt>
}