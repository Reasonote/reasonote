
export function LI({children, ...rest}){
    return <li {...rest} className={`${rest.className ?? ''}`} >
        {children}
    </li>
}