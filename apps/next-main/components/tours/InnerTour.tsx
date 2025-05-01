import Tour from "reactour";

export default function InnerTour(props: any){
    //@ts-expect-error
    return <Tour {...props} />
}