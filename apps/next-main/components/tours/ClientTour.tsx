import dynamic from "next/dynamic";

const InnerTour = dynamic(() => import("./InnerTour"), { ssr: false });

export function ClientTour(props: any){
    //@ts-ignore
    return <InnerTour {...props} />
}