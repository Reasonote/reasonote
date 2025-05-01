import * as Priompt from '@anysphere/priompt';
import { Block } from '@reasonote/lib-ai';
import { UnifiedResource } from '@reasonote/lib-ai/interfaces';

export function ResourceMetadata({resource}: {resource: UnifiedResource}) {
    return (
        <Block name="RESOURCE" attributes={{ id: resource.id, name: resource.name, source: resource.source }}>
            {resource.name}
        </Block>
    );
}