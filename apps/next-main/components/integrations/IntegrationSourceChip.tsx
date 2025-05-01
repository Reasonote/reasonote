import {Chip} from "@mui/material";
import {
  useIntegrationFlatFragLoader,
} from "@reasonote/lib-sdk-apollo-client-react";

export function IntegrationSourceChip({integrationId}: {integrationId: string}){
    const {data: integration} = useIntegrationFlatFragLoader(integrationId);

    return integration?.type === 'readwise' ? (
        <Chip icon={
            <img src="/static/images/Readwise-Icon-Dark.svg" width={15} height={15} alt="Readwise logo"/>}
                label="Imported From Readwise" color="gray" size="small"
            />
    ) : null;
}