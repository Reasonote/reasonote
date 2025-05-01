import { graphql } from '../../codegen';

export const getBotSetForUserQueryDoc = graphql(/* GraphQL */ `
    query getBotSetWithBots (
        $filter: BotSetFilter
        $orderBy: [BotSetOrderBy!]
        $first: Int
        $after: Cursor
        $last: Int
        $before: Cursor
        $filterBot: BotSetBotFilter
        $orderByBot: [BotSetBotOrderBy!]
        $firstBot: Int
        $afterBot: Cursor
        $lastBot: Int
    ) {
        botSetCollection (
            filter: $filter
            orderBy: $orderBy
            first: $first
            after: $after
            last: $last
            before: $before
        ) {
            edges {
                node {
                    ...BotSetFlatFrag
                    botSetBotCollection(
                        filter: $filterBot
                        orderBy: $orderByBot
                        first: $firstBot
                        after: $afterBot
                        last: $lastBot
                    )
                    {
                        edges {
                            node {
                                ...BotSetBotFlatFrag
                                bot {
                                    ...BotFlatFrag
                                }
                            }
                        }
                        pageInfo {
                            ...PageInfoFlatFrag
                        }
                    }
                }
            }
            pageInfo {
                ...PageInfoFlatFrag
            }
        }
    }
`);