import {useQuery} from "@apollo/client";
import {
  GetMemberAuthorizationDeepDocument,
} from "@reasonote/lib-sdk-apollo-client";

export interface UseChatMembersArgs {
    chatId?: string;
}

export function useChatMembers(args: UseChatMembersArgs) {
    const {chatId} = args;
    const res = useQuery(GetMemberAuthorizationDeepDocument, {
        variables: {
            filter: {
                grantedEntityId: {
                    eq: chatId ?? 'FAKE_ID'
                }
            }
        }
    });

    return res;
}